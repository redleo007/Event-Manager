import { getSupabaseClient } from '../utils/supabase';

interface ImportSession {
  id: string;
  event_id: string;
  import_type: 'participants' | 'attendance';
  status: 'active' | 'reverted';
  record_count: number;
  uploaded_at: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  import_session_id: string;
  action: 'create' | 'delete' | 'revert';
  details: string;
  created_at: string;
}

/**
 * Get import sessions for an event (last 30 days)
 */
export async function getImportSessions(
  eventId: string,
  daysBack: number = 30
): Promise<ImportSession[]> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('import_sessions')
      .select('*')
      .eq('event_id', eventId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching import sessions:', error);
    throw new Error(`Failed to fetch import sessions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a specific import session
 */
export async function getImportSession(sessionId: string): Promise<ImportSession | null> {
  try {
    const supabase = getSupabaseClient();

    const { data: session, error: sessionError } = await supabase
      .from('import_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;

    return session as ImportSession || null;
  } catch (error) {
    console.error('Error fetching import session:', error);
    throw new Error(`Failed to fetch import session: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get audit logs for an import session
 */
export async function getAuditLogs(sessionId: string): Promise<AuditLog[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: logs, error } = await supabase
      .from('import_audit_logs')
      .select('*')
      .eq('import_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return logs || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Delete a participants import and all associated data
 */
export async function deleteParticipantImport(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Check if session exists and is within 30 days
    const session = await validateImportSession(sessionId, 'participants');

    // Start transaction by fetching all data first
    const { data: participants, error: fetchError } = await supabase
      .from('participants')
      .select('id')
      .eq('import_session_id', sessionId);

    if (fetchError) throw fetchError;

    if (participants && participants.length > 0) {
      const participantIds = participants.map((p: any) => p.id);

      // Delete attendance records for these participants
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .in('participant_id', participantIds);

      if (attendanceError) throw attendanceError;

      // Delete from blocklist if any
      const { error: blocklistError } = await supabase
        .from('blocklist')
        .delete()
        .in('participant_id', participantIds);

      if (blocklistError) throw blocklistError;

      // Delete participants
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('import_session_id', sessionId);

      if (participantError) throw participantError;
    }

    // Mark import session as reverted
    const { error: updateError } = await supabase
      .from('import_sessions')
      .update({ status: 'reverted' })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Log the deletion
    await createAuditLog(
      sessionId,
      'delete',
      `Deleted participants import: ${participants?.length || 0} participants and associated attendance records removed`
    );
  } catch (error) {
    console.error('Error deleting participant import:', error);
    throw new Error(`Failed to delete participant import: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Revert an attendance import with snapshot restoration
 */
export async function revertAttendanceImport(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Check if session exists and is within 30 days
    const session = await validateImportSession(sessionId, 'attendance');

    // Get all snapshots for this import
    const { data: snapshots, error: snapshotError } = await supabase
      .from('attendance_snapshots')
      .select('*')
      .eq('import_session_id', sessionId);

    if (snapshotError) throw snapshotError;

    if (snapshots && snapshots.length > 0) {
      // Restore previous attendance status
      for (const snapshot of snapshots) {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ status: snapshot.previous_status })
          .eq('id', snapshot.attendance_id);

        if (updateError) throw updateError;

        // Restore blocklist status if it was modified
        if (snapshot.previous_blocklist_status !== undefined) {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('participant_id')
            .eq('id', snapshot.attendance_id)
            .single();

          if (attendance?.participant_id) {
            const { error: blocklistError } = await supabase
              .from('participants')
              .update({ is_blocklisted: snapshot.previous_blocklist_status })
              .eq('id', attendance.participant_id);

            if (blocklistError) throw blocklistError;
          }
        }

        // If this was a new participant, delete it
        if (snapshot.is_new_participant) {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('participant_id')
            .eq('id', snapshot.attendance_id)
            .single();

          if (attendance?.participant_id) {
            await supabase
              .from('participants')
              .delete()
              .eq('id', attendance.participant_id);
          }
        }
      }

      // Delete the attendance records from this import
      const { data: attendanceRecords, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('import_session_id', sessionId);

      if (fetchError) throw fetchError;

      if (attendanceRecords && attendanceRecords.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('import_session_id', sessionId);

        if (deleteError) throw deleteError;
      }

      // Delete snapshots
      const { error: deleteSnapshotsError } = await supabase
        .from('attendance_snapshots')
        .delete()
        .eq('import_session_id', sessionId);

      if (deleteSnapshotsError) throw deleteSnapshotsError;
    }

    // Mark import session as reverted
    const { error: updateError } = await supabase
      .from('import_sessions')
      .update({ status: 'reverted' })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Log the reversion
    await createAuditLog(
      sessionId,
      'revert',
      `Reverted attendance import: ${snapshots?.length || 0} records restored to previous state`
    );
  } catch (error) {
    console.error('Error reverting attendance import:', error);
    throw new Error(`Failed to revert attendance import: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate that an import session exists and is within the allowed time window
 */
async function validateImportSession(
  sessionId: string,
  expectedType: 'participants' | 'attendance'
): Promise<ImportSession> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: session, error } = await supabase
      .from('import_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new Error('Import session not found');
    }

    if (session.import_type !== expectedType) {
      throw new Error(`Import type mismatch. Expected ${expectedType}, got ${session.import_type}`);
    }

    // Check if within 30 days (using created_at field)
    const createdDate = new Date(session.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (createdDate < thirtyDaysAgo) {
      throw new Error('Cannot delete imports older than 30 days');
    }

    return session;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Create an audit log entry
 */
async function createAuditLog(
  sessionId: string,
  action: 'create' | 'delete' | 'revert',
  details: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('import_audit_logs')
      .insert([
        {
          import_session_id: sessionId,
          action,
          details,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't block operations
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

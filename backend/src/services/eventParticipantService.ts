import { getSupabaseClient } from '../utils/supabase';
import { randomBytes } from 'crypto';

/**
 * Event-based participant management with full delete support
 */

/**
 * Check if a participant already exists in the event
 * Matching logic: email (if provided) or name
 */
export async function checkParticipantExists(
  eventId: string,
  name: string,
  email?: string
): Promise<string | null> {
  const supabase = getSupabaseClient();

  // If email is provided, match by email first
  if (email && email.trim()) {
    const { data: byEmail } = await supabase
      .from('participants')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (byEmail) return byEmail.id;
  }

  // Fall back to name matching
  if (name && name.trim()) {
    const { data: byName } = await supabase
      .from('participants')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (byName) return byName.id;
  }

  return null;
}

/**
 * Get all participants for an event
 */
export async function getEventParticipants(eventId: string): Promise<any[]> {
  const supabase = getSupabaseClient();

  // Get attendance records for this event, then fetch unique participants
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('attendance')
    .select('participant_id')
    .eq('event_id', eventId);

  if (attendanceError) throw new Error(`Failed to fetch attendance: ${attendanceError.message}`);

  // If no attendance, return empty array
  if (!attendanceData || attendanceData.length === 0) {
    return [];
  }

  // Get unique participant IDs from attendance
  const participantIds = [...new Set(attendanceData.map((a: any) => a.participant_id))];

  // Fetch participant details for those IDs
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, email, is_blocklisted')
    .in('id', participantIds)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch participants: ${error.message}`);

  return data || [];
}

/**
 * Get attendance records for an event with participant details
 */
export async function getEventAttendance(eventId: string): Promise<any[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      participant_id,
      status,
      created_at,
      participants(
        id,
        name,
        email,
        is_blocklisted
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);

  // Transform the response to flatten participant data
  return (data || []).map((record: any) => ({
    id: record.id,
    participant_id: record.participant_id,
    status: record.status,
    created_at: record.created_at,
    name: record.participants?.name,
    email: record.participants?.email,
    is_blocklisted: record.participants?.is_blocklisted
  }));
}

/**
 * In-memory backup store for last delete action per event.
 * This enables a one-time undo using an ephemeral token returned to the client.
 * Note: Backups are overwritten on each new delete and cleared after undo.
 */
type DeleteBackup = {
  type: 'participant' | 'attendance';
  undoToken: string;
  createdAt: number;
  used: boolean;
  participants?: Array<{ id: string; name: string; email: string; is_blocklisted: boolean; blocklist_reason?: string }>; // for participant deletes
  attendance?: Array<{ id: string; event_id: string; participant_id: string; status: 'attended' | 'not_attended'; marked_at?: string; created_at?: string } & { name?: string; email?: string }>; // include participant info for safer restore
};

const deleteBackups: Map<string, DeleteBackup> = new Map();

function createUndoToken(): string {
  return randomBytes(16).toString('hex');
}

function setBackup(eventId: string, backup: DeleteBackup) {
  deleteBackups.set(eventId, backup);
}

function getBackup(eventId: string): DeleteBackup | undefined {
  return deleteBackups.get(eventId);
}

function markBackupUsed(eventId: string) {
  const b = deleteBackups.get(eventId);
  if (b) {
    b.used = true;
    deleteBackups.set(eventId, b);
  }
}

/**
 * Delete all participants for an event
 * This also deletes all their attendance records
 */
export async function deleteAllEventParticipants(eventId: string): Promise<{ deleted: number; undoToken: string }> {
  const supabase = getSupabaseClient();

  // 1. Gather attendance (attended)
  const { data: attendanceRecords, error: attendanceFetchError } = await supabase
    .from('attendance')
    .select(`id, event_id, participant_id, status, marked_at, created_at, participants(id, name, email, is_blocklisted, blocklist_reason)`)
    .eq('event_id', eventId);

  if (attendanceFetchError) throw new Error(`Failed to fetch attendance: ${attendanceFetchError.message}`);

  // 2. Gather no-shows (not_attended)
  const { data: noShowRecords, error: noShowFetchError } = await supabase
    .from('no_shows')
    .select(`id, event_id, participant_id, created_at, participants(id, name, email, is_blocklisted, blocklist_reason)`)
    .eq('event_id', eventId);

  if (noShowFetchError) throw new Error(`Failed to fetch no-shows: ${noShowFetchError.message}`);

  // Normalize no-shows to match attendance structure for backup
  const normalizedNoShows = (noShowRecords || []).map((r: any) => ({
    ...r,
    status: 'not_attended',
    marked_at: r.created_at // no-shows use created_at as marked_at
  }));

  const allRecords = [...(attendanceRecords || []), ...normalizedNoShows];
  const participantIds = [...new Set(allRecords.map((a: any) => a.participant_id))];

  // Fetch participant details for all involved
  const { data: participantData, error: participantFetchError } = await supabase
    .from('participants')
    .select('id, name, email, is_blocklisted, blocklist_reason')
    .in('id', participantIds);

  if (participantFetchError) throw new Error(`Failed to fetch participants: ${participantFetchError.message}`);

  // Create backup
  const undoToken = createUndoToken();
  setBackup(eventId, {
    type: 'participant',
    undoToken,
    createdAt: Date.now(),
    used: false,
    participants: (participantData || []) as DeleteBackup['participants'],
    attendance: allRecords.map((rec: any) => ({
      id: rec.id,
      event_id: rec.event_id,
      participant_id: rec.participant_id,
      status: rec.status,
      marked_at: rec.marked_at,
      created_at: rec.created_at,
      name: rec.participants?.name,
      email: rec.participants?.email,
    })) as DeleteBackup['attendance'],
  });

  // Delete from attendance
  const { error: attendanceDeleteError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId);

  if (attendanceDeleteError) throw new Error(`Failed to delete attendance records: ${attendanceDeleteError.message}`);

  // Delete from no_shows
  const { error: noShowDeleteError } = await supabase
    .from('no_shows')
    .delete()
    .eq('event_id', eventId);

  if (noShowDeleteError) throw new Error(`Failed to delete no-show records: ${noShowDeleteError.message}`);

  // Check for remaining references in attendance
  const { data: remainingAttendance, error: remainingError } = await supabase
    .from('attendance')
    .select('participant_id')
    .in('participant_id', participantIds);

  if (remainingError) throw new Error(`Failed to check remaining attendance: ${remainingError.message}`);

  // Check for remaining references in no_shows
  const { data: remainingNoShows, error: remainingNoShowsError } = await supabase
    .from('no_shows')
    .select('participant_id')
    .in('participant_id', participantIds);

  if (remainingNoShowsError) throw new Error(`Failed to check remaining no-shows: ${remainingNoShowsError.message}`);

  const stillReferenced = new Set([
    ...(remainingAttendance || []).map((r: any) => r.participant_id),
    ...(remainingNoShows || []).map((r: any) => r.participant_id)
  ]);

  const deletableParticipantIds = participantIds.filter(id => !stillReferenced.has(id));

  if (deletableParticipantIds.length > 0) {
    const { error: participantDeleteError } = await supabase
      .from('participants')
      .delete()
      .in('id', deletableParticipantIds);

    if (participantDeleteError) throw new Error(`Failed to delete participants: ${participantDeleteError.message}`);
  }

  return { deleted: participantIds.length, undoToken };
}

/**
 * Delete selected participants (by IDs)
 * This also deletes their attendance records
 */
export async function deleteSelectedParticipants(
  eventId: string,
  participantIds: string[]
): Promise<{ deleted: number }> {
  const supabase = getSupabaseClient();

  if (!participantIds || participantIds.length === 0) {
    return { deleted: 0 };
  }

  // Delete attendance records
  const { error: attendanceError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .in('participant_id', participantIds);

  if (attendanceError) {
    throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
  }

  // Delete no-show records
  const { error: noShowError } = await supabase
    .from('no_shows')
    .delete()
    .eq('event_id', eventId)
    .in('participant_id', participantIds);

  if (noShowError) {
    throw new Error(`Failed to delete no-show records: ${noShowError.message}`);
  }

  // Delete the participants themselves
  // Note: This might fail if they are referenced in other events, which is expected/safe
  const { error: deleteError } = await supabase
    .from('participants')
    .delete()
    .in('id', participantIds);

  if (deleteError) {
    // If we fail to delete participant due to FK (other events), that's fine.
    // We successfully removed them from THIS event (attendance/no_shows).
    // So we don't throw an error here, unless it's something else.
    if (!deleteError.message.includes('foreign key constraint')) {
      throw new Error(`Failed to delete participants: ${deleteError.message}`);
    }
  }

  return { deleted: participantIds.length };
}

/**
 * Delete all attendance records for an event
 * This keeps participants intact
 */
export async function deleteAllEventAttendance(eventId: string): Promise<{ deleted: number; undoToken: string }> {
  const supabase = getSupabaseClient();

  // Backup attendance
  const { data: attendanceRecords, error: attendanceFetchError } = await supabase
    .from('attendance')
    .select(`id, event_id, participant_id, status, marked_at, created_at, participants(id, name, email)`)
    .eq('event_id', eventId);

  if (attendanceFetchError) throw new Error(`Failed to fetch attendance: ${attendanceFetchError.message}`);

  // Backup no-shows
  const { data: noShowRecords, error: noShowFetchError } = await supabase
    .from('no_shows')
    .select(`id, event_id, participant_id, created_at, participants(id, name, email)`)
    .eq('event_id', eventId);

  if (noShowFetchError) throw new Error(`Failed to fetch no-shows: ${noShowFetchError.message}`);

  const normalizedNoShows = (noShowRecords || []).map((r: any) => ({
    ...r,
    status: 'not_attended',
    marked_at: r.created_at
  }));

  const allRecords = [...(attendanceRecords || []), ...normalizedNoShows];

  const undoToken = createUndoToken();
  setBackup(eventId, {
    type: 'attendance',
    undoToken,
    createdAt: Date.now(),
    used: false,
    attendance: allRecords.map((rec: any) => ({
      id: rec.id,
      event_id: rec.event_id,
      participant_id: rec.participant_id,
      status: rec.status,
      marked_at: rec.marked_at,
      created_at: rec.created_at,
      name: rec.participants?.name,
      email: rec.participants?.email,
    })),
  });

  const { data: delAtt, error: deleteError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .select();

  if (deleteError) throw new Error(`Failed to delete attendance: ${deleteError.message}`);

  const { data: delNoShows, error: deleteNoShowError } = await supabase
    .from('no_shows')
    .delete()
    .eq('event_id', eventId)
    .select();

  if (deleteNoShowError) throw new Error(`Failed to delete no-shows: ${deleteNoShowError.message}`);

  return { deleted: (delAtt?.length || 0) + (delNoShows?.length || 0), undoToken };
}

/**
 * Delete selected attendance records (by IDs)
 */
export async function deleteSelectedAttendance(
  eventId: string,
  attendanceIds: string[]
): Promise<{ deleted: number }> {
  const supabase = getSupabaseClient();

  if (!attendanceIds || attendanceIds.length === 0) {
    return { deleted: 0 };
  }

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .in('id', attendanceIds);

  if (error) throw new Error(`Failed to delete attendance: ${error.message}`);

  return { deleted: attendanceIds.length };
}

/**
 * Undo the last delete for an event (one-time, token-based).
 * - type 'participant': restores participants (dedup by email/name) and their attendance for the event
 * - type 'attendance': restores attendance records for the event (ensures participant exists)
 */
export async function undoLastDelete(
  eventId: string,
  type: 'participant' | 'attendance',
  undoToken: string
): Promise<{ restored: number }> {
  const supabase = getSupabaseClient();
  const backup = getBackup(eventId);

  if (!backup || backup.used || backup.type !== type || backup.undoToken !== undoToken) {
    throw new Error('No undo available for this event or token has expired');
  }

  let restored = 0;

  if (type === 'participant') {
    // Restore participants (dedup) and map old to new IDs by email/name
    const idMap = new Map<string, string>(); // key: original participant_id, value: current participant_id

    for (const p of backup.participants || []) {
      // Try to find existing participant by email; fall back to name
      let currentId: string | null = null;
      if (p.email) {
        const { data: byEmail } = await supabase
          .from('participants')
          .select('id')
          .eq('email', p.email)
          .single();
        if (byEmail) currentId = byEmail.id;
      }
      if (!currentId && p.name) {
        const { data: byName } = await supabase
          .from('participants')
          .select('id')
          .eq('name', p.name)
          .single();
        if (byName) currentId = byName.id;
      }

      if (!currentId) {
        // Recreate participant
        const { data: newP, error: insertError } = await supabase
          .from('participants')
          .insert({
            name: p.name,
            email: p.email,
            is_blocklisted: p.is_blocklisted,
            blocklist_reason: p.blocklist_reason || null,
          })
          .select()
          .single();
        if (insertError) throw new Error(`Failed to restore participant: ${insertError.message}`);
        currentId = newP.id;
      }

      idMap.set(p.id, currentId);
    }

    // Restore attendance for this event, linking to current participant IDs
    for (const a of backup.attendance || []) {
      const mappedParticipantId = idMap.get(a.participant_id) || a.participant_id;

      const targetTable = a.status === 'attended' ? 'attendance' : 'no_shows';

      // Check if record already exists
      const { data: existing } = await supabase
        .from(targetTable)
        .select('id')
        .eq('event_id', eventId)
        .eq('participant_id', mappedParticipantId)
        .single();

      if (!existing) {
        if (targetTable === 'attendance') {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              event_id: eventId,
              participant_id: mappedParticipantId,
              status: 'attended',
              marked_at: a.marked_at || new Date().toISOString(),
            });
          if (insertError) throw new Error(`Failed to restore attendance: ${insertError.message}`);
        } else {
          // no_shows
          const { error: insertError } = await supabase
            .from('no_shows')
            .insert({
              event_id: eventId,
              participant_id: mappedParticipantId,
              created_at: a.marked_at || new Date().toISOString(),
            });
          if (insertError) throw new Error(`Failed to restore no-show: ${insertError.message}`);
        }
        restored++;
      }
    }
  } else if (type === 'attendance') {
    // Restore attendance records for this event
    for (const a of backup.attendance || []) {
      // Ensure participant exists (try by id; else by email/name)
      let participantId = a.participant_id;
      const { data: exists } = await supabase
        .from('participants')
        .select('id')
        .eq('id', participantId)
        .single();

      if (!exists) {
        // Try by email
        let foundId: string | null = null;
        if (a.email) {
          const { data: byEmail } = await supabase
            .from('participants')
            .select('id')
            .eq('email', a.email)
            .single();
          if (byEmail) foundId = byEmail.id;
        }
        if (!foundId && a.name) {
          const { data: byName } = await supabase
            .from('participants')
            .select('id')
            .eq('name', a.name)
            .single();
          if (byName) foundId = byName.id;
        }

        if (!foundId) {
          // Recreate participant minimally
          const { data: newP, error: insertError } = await supabase
            .from('participants')
            .insert({ name: a.name || 'Unknown', email: a.email || `${Date.now()}@restore.local`, is_blocklisted: false })
            .select()
            .single();
          if (insertError) throw new Error(`Failed to restore participant: ${insertError.message}`);
          participantId = newP.id;
        } else {
          participantId = foundId;
        }
      }

      // Check if attendance/no-show exists; if not, re-insert
      // Determine target table based on status
      const targetTable = a.status === 'attended' ? 'attendance' : 'no_shows';

      const { data: existingRecord } = await supabase
        .from(targetTable)
        .select('id')
        .eq('event_id', eventId)
        .eq('participant_id', participantId)
        .single();

      if (!existingRecord) {
        if (targetTable === 'attendance') {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              event_id: eventId,
              participant_id: participantId,
              status: 'attended',
              marked_at: a.marked_at || new Date().toISOString(),
            });
          if (insertError) throw new Error(`Failed to restore attendance: ${insertError.message}`);
        } else {
          // no_shows
          const { error: insertError } = await supabase
            .from('no_shows')
            .insert({
              event_id: eventId,
              participant_id: participantId,
              created_at: a.marked_at || new Date().toISOString(), // Use marked_at as created_at for no_shows restoration
            });
          if (insertError) throw new Error(`Failed to restore no-show: ${insertError.message}`);
        }
        restored++;
      }
    }
  }

  markBackupUsed(eventId);
  return { restored };
}

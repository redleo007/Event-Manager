import { getSupabaseClient } from '../utils/supabase';

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
 * Delete all participants for an event
 * This also deletes all their attendance records
 */
export async function deleteAllEventParticipants(eventId: string): Promise<{ deleted: number }> {
  const supabase = getSupabaseClient();

  // Get all participants without event-scoping (global participants)
  const { data: participants, error: fetchError } = await supabase
    .from('participants')
    .select('id');

  if (fetchError) throw new Error(`Failed to fetch participants: ${fetchError.message}`);

  if (!participants || participants.length === 0) {
    return { deleted: 0 };
  }

  const participantIds = participants.map((p: any) => p.id);

  // Delete attendance records for the event
  const { error: attendanceError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId);

  if (attendanceError) {
    throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
  }

  // Delete participants only if they have no attendance in any other event
  const { data: otherAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('participant_id', { count: 'exact' })
    .in('participant_id', participantIds);

  if (checkError) throw new Error(`Failed to check other attendance: ${checkError.message}`);

  // Only delete participants if they don't have attendance in other events
  if (!otherAttendance || otherAttendance.length === 0) {
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .in('id', participantIds);

    if (deleteError) throw new Error(`Failed to delete participants: ${deleteError.message}`);
  }

  return { deleted: participantIds.length };
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

  // Delete attendance records for these participants in the event
  const { error: attendanceError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .in('participant_id', participantIds);

  if (attendanceError) {
    throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
  }

  // Delete the participants themselves
  const { error: deleteError } = await supabase
    .from('participants')
    .delete()
    .in('id', participantIds);

  if (deleteError) throw new Error(`Failed to delete participants: ${deleteError.message}`);

  return { deleted: participantIds.length };
}

/**
 * Delete all attendance records for an event
 * This keeps participants intact
 */
export async function deleteAllEventAttendance(eventId: string): Promise<{ deleted: number }> {
  const supabase = getSupabaseClient();

  const { data, error: deleteError } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .select();

  if (deleteError) throw new Error(`Failed to delete attendance: ${deleteError.message}`);

  return { deleted: data?.length || 0 };
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

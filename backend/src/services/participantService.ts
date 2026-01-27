import { getSupabaseClient } from '../utils/supabase';

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_blocklisted: boolean;
  blocklist_reason?: string;
  created_at: string;
}

export const createParticipant = async (participantData: Omit<Participant, 'id' | 'created_at'>): Promise<Participant> => {
  const supabase = getSupabaseClient();
  
  // Check for duplicates
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('email', participantData.email);

  if (existing && existing.length > 0) {
    throw new Error(`Participant with email ${participantData.email} already exists`);
  }
  
  const { data, error } = await supabase
    .from('participants')
    .insert([participantData])
    .select()
    .single();

  if (error) throw new Error(`Failed to create participant: ${error.message}`);
  return data as Participant;
};

export const createParticipantWithEvent = async (participantData: { full_name: string; eventpass_id: string }): Promise<Participant> => {
  const supabase = getSupabaseClient();
  
  // Create participant with minimal data (full_name becomes name)
  const { data, error } = await supabase
    .from('participants')
    .insert([{
      name: participantData.full_name.trim(),
      email: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}@eventpass.local`,
      is_blocklisted: false,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create participant: ${error.message}`);
  
  // Create attendance record to associate with event
  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert([{
      event_id: participantData.eventpass_id,
      participant_id: data.id,
      status: 'not_attended',
    }]);

  if (attendanceError) {
    // Clean up participant if attendance creation fails
    await supabase.from('participants').delete().eq('id', data.id);
    throw new Error(`Failed to associate participant with event: ${attendanceError.message}`);
  }

  return data as Participant;
};

export const bulkCreateParticipantsWithEvent = async (
  participantsData: Array<{ full_name: string; event_id: string }>,
  import_session_id?: string
): Promise<Participant[]> => {
  const supabase = getSupabaseClient();
  
  // Prepare all participants for batch insert
  const participantsToInsert = participantsData.map(p => ({
    name: p.full_name.trim(),
    email: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 3)}@eventpass.local`,
    is_blocklisted: false,
    import_session_id: import_session_id || null,
  }));

  // Batch insert all participants
  const { data: createdParticipants, error: insertError } = await supabase
    .from('participants')
    .insert(participantsToInsert)
    .select();

  if (insertError) throw new Error(`Failed to create participants: ${insertError.message}`);

  // Prepare attendance records for batch insert
  const attendanceRecords = (createdParticipants || []).map((participant, idx) => ({
    event_id: participantsData[idx].event_id,
    participant_id: participant.id,
    status: 'not_attended' as const,
    import_session_id: import_session_id || null,
  }));

  // Batch insert all attendance records
  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert(attendanceRecords);

  if (attendanceError) {
    // Clean up participants if attendance creation fails
    const participantIds = (createdParticipants || []).map(p => p.id);
    if (participantIds.length > 0) {
      await supabase.from('participants').delete().in('id', participantIds);
    }
    throw new Error(`Failed to associate participants with event: ${attendanceError.message}`);
  }

  return createdParticipants as Participant[];
};

export const getParticipants = async (includeBlocklisted: boolean = false): Promise<Participant[]> => {
  const supabase = getSupabaseClient();
  
  let query = supabase.from('participants').select('*');
  
  if (!includeBlocklisted) {
    query = query.eq('is_blocklisted', false);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch participants: ${error.message}`);
  return (data || []) as Participant[];
};

export const getParticipantById = async (id: string): Promise<Participant> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch participant: ${error.message}`);
  return data as Participant;
};

export const updateParticipant = async (id: string, updates: Partial<Participant>): Promise<Participant> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update participant: ${error.message}`);
  return data as Participant;
};

export const getActiveParticipantsCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();
  
  const { count, error } = await supabase
    .from('participants')
    .select('*', { count: 'exact' })
    .eq('is_blocklisted', false);

  if (error) throw new Error(`Failed to count active participants: ${error.message}`);
  return count || 0;
};

export const getBlocklistedParticipantsCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();
  
  const { count, error } = await supabase
    .from('participants')
    .select('*', { count: 'exact' })
    .eq('is_blocklisted', true);

  if (error) throw new Error(`Failed to count blocklisted participants: ${error.message}`);
  return count || 0;
};

/**
 * Bulk import participants with deduplication for an event
 * Rules:
 * - Requires email per participant (unique identifier)
 * - Only creates participants (no attendance side effects)
 * - Re-uploads of the same file do NOT change counts
 */
export const bulkCreateParticipantsWithEventDedup = async (
  participantsData: Array<{ full_name: string; email?: string; event_id: string }>,
  import_session_id?: string
): Promise<{ created: Participant[]; duplicates: number }> => {
  const supabase = getSupabaseClient();

  // Enforce unique identifier (email) up front
  const normalized = participantsData.map((p) => ({
    full_name: p.full_name?.trim(),
    email: p.email?.toLowerCase().trim(),
    event_id: p.event_id,
  }));

  const invalid = normalized.filter((p) => !p.email);
  if (invalid.length > 0) {
    throw new Error('All participants must include email for import');
  }

  const emails = Array.from(new Set(normalized.map((p) => p.email as string)));

  // Fetch existing participants in a single query
  const { data: existing, error: existingError } = await supabase
    .from('participants')
    .select('id, email')
    .in('email', emails);

  if (existingError) {
    throw new Error(`Failed to fetch participants for dedup: ${existingError.message}`);
  }

  const existingEmails = new Set<string>((existing || []).map((p: any) => String(p.email).toLowerCase()));

  const toInsert = normalized
    .filter((p) => !existingEmails.has(p.email as string))
    .map((p) => ({
      name: p.full_name || p.email?.split('@')[0] || 'Unknown',
      email: p.email,
      is_blocklisted: false,
      import_session_id: import_session_id || null,
    }));

  let created: Participant[] = [];
  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('participants')
      .insert(toInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to create participants: ${insertError.message}`);
    }

    created = (inserted || []) as Participant[];
  }

  const duplicates = emails.length - toInsert.length;

  return { created, duplicates };
};

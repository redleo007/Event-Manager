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

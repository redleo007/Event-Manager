import { getSupabaseClient } from '../utils/supabase';

export interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) throw new Error(`Failed to create event: ${error.message}`);
  return data as Event;
};

export const getEvents = async (): Promise<Event[]> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return (data || []) as Event[];
};

export const getEventById = async (id: string): Promise<Event> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch event: ${error.message}`);
  return data as Event;
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update event: ${error.message}`);
  return data as Event;
};

export const deleteEvent = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient();
  
  // Delete related records first
  await supabase.from('attendance').delete().eq('event_id', id);
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
};

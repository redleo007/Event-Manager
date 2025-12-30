import { getSupabaseClient } from '../utils/supabase';

export interface Attendance {
  id: string;
  event_id: string;
  participant_id: string;
  status: 'attended' | 'no_show';
  marked_at: string;
  created_at: string;
}

export const markAttendance = async (attendanceData: Omit<Attendance, 'id' | 'created_at' | 'marked_at'>): Promise<Attendance> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('attendance')
    .insert([{ ...attendanceData, marked_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw new Error(`Failed to mark attendance: ${error.message}`);
  return data as Attendance;
};

export const getAttendanceByEvent = async (eventId: string): Promise<Attendance[]> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);
  return (data || []) as Attendance[];
};

export const getAttendanceByParticipant = async (participantId: string): Promise<Attendance[]> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('participant_id', participantId);

  if (error) throw new Error(`Failed to fetch participant attendance: ${error.message}`);
  return (data || []) as Attendance[];
};

export const updateAttendance = async (id: string, status: 'attended' | 'no_show'): Promise<Attendance> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('attendance')
    .update({ status, marked_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update attendance: ${error.message}`);
  return data as Attendance;
};

export const getNoShowCount = async (participantId: string): Promise<number> => {
  const supabase = getSupabaseClient();
  
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('participant_id', participantId)
    .eq('status', 'no_show');

  if (error) throw new Error(`Failed to count no-shows: ${error.message}`);
  return count || 0;
};

export const getAttendanceStats = async (): Promise<{ attended: number; noShow: number }> => {
  const supabase = getSupabaseClient();
  
  const { count: attendedCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('status', 'attended');

  const { count: noShowCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('status', 'no_show');

  return {
    attended: attendedCount || 0,
    noShow: noShowCount || 0,
  };
};

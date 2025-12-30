import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
};

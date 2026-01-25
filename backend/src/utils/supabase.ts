import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    const missing: string[] = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!key) missing.push('SUPABASE_KEY');

    const hint = 'Add the missing value(s) to your environment (.env) or deployment config.';
    throw new Error(`Missing Supabase credentials: ${missing.join(', ')}. ${hint}`);
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

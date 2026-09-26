
import {
  supabase as validatedSupabase,
  getSupabaseClient,
  getSupabaseConfig,
  isSupabaseConfigured
} from './lib/supabase';

export const supabase = validatedSupabase;
export { getSupabaseClient, getSupabaseConfig, isSupabaseConfigured };


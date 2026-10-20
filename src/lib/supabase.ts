import { createClient } from '@supabase/supabase-js';
import { hasSupabase, supabaseAnonKey, supabaseUrl } from './config';

export const isSupabaseConfigured = () => hasSupabase;

// A placeholder client is created in demo mode so imports never crash; it is never called.
export const supabase = createClient(
  hasSupabase ? supabaseUrl : 'https://demo.supabase.co',
  hasSupabase ? supabaseAnonKey : 'demo-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

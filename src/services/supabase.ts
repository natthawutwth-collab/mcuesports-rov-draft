import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite environment variables
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

function isValidHttpUrl(str: string | undefined): boolean {
  if (!str) return false;
  try {
    const parsed = new URL(str);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !str.includes('your-project');
  } catch {
    return false;
  }
}

export const SUPABASE_URL: string = isValidHttpUrl(envUrl) ? (envUrl as string) : '';
export const SUPABASE_ANON_KEY: string =
  envAnonKey && !envAnonKey.includes('your-anon-key') && envAnonKey !== 'MY_SUPABASE_ANON_KEY'
    ? envAnonKey
    : '';

export const isSupabaseConfigured: boolean = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Validate Supabase connection status
 */
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('team_rosters').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase ping check error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase offline or unreachable:', err);
    return false;
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'mcu_rov_supabase_url_custom';
const STORAGE_KEY_KEY = 'mcu_rov_supabase_key_custom';

export const DEFAULT_SUPABASE_URL = 'https://dgshiuxfrkciuxscckwk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc2hpdXhmcmtjaXV4c2Nja3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODA2NDUsImV4cCI6MjEwNTk1NjY0NX0.TWFoHAFa-f7luSYj938z1lyvF9VVIiH7jd8n7y-nPiQ';

export function cleanSupabaseUrl(str: string | undefined): string {
  if (!str) return '';
  let clean = str.trim();
  // Strip /rest/v1 or /rest/v1/ suffix if user pasted REST endpoint
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

function isValidHttpUrl(str: string | undefined): boolean {
  if (!str) return false;
  try {
    const cleaned = cleanSupabaseUrl(str);
    const parsed = new URL(cleaned);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !cleaned.includes('your-project')
    );
  } catch {
    return false;
  }
}

export function getCustomSupabaseCredentials(): { url: string; key: string } {
  try {
    const customUrl = cleanSupabaseUrl(localStorage.getItem(STORAGE_URL_KEY) || '');
    const customKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';
    return { url: customUrl, key: customKey };
  } catch {
    return { url: '', key: '' };
  }
}

function resolveSupabaseCredentials(): { url: string; key: string } {
  // 1. Check custom credentials in localStorage first
  const custom = getCustomSupabaseCredentials();
  if (isValidHttpUrl(custom.url) && custom.key.length > 10) {
    return { url: cleanSupabaseUrl(custom.url), key: custom.key };
  }

  // 2. Check environment variables
  const envUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  if (
    isValidHttpUrl(envUrl) &&
    envAnonKey &&
    !envAnonKey.includes('your-anon-key') &&
    envAnonKey !== 'MY_SUPABASE_ANON_KEY'
  ) {
    return { url: envUrl, key: envAnonKey };
  }

  // 3. Fallback to Project Built-in Credentials
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY,
  };
}

let activeCreds = resolveSupabaseCredentials();
export let SUPABASE_URL: string = activeCreds.url;
export let SUPABASE_ANON_KEY: string = activeCreds.key;
export let isSupabaseConfigured: boolean = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function createClientInstance(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export let supabase: SupabaseClient | null = createClientInstance();

const listeners = new Set<(isConfigured: boolean) => void>();

export function subscribeSupabaseConfigChange(listener: (isConfigured: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCustomSupabaseCredentials(url: string, key: string) {
  try {
    const cleanUrl = cleanSupabaseUrl(url);
    const cleanKey = key.trim();
    if (cleanUrl) {
      localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
    }
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
  } catch (e) {
    console.error('Failed to store Supabase credentials in localStorage', e);
  }

  activeCreds = resolveSupabaseCredentials();
  SUPABASE_URL = activeCreds.url;
  SUPABASE_ANON_KEY = activeCreds.key;
  isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  supabase = createClientInstance();

  listeners.forEach((fn) => {
    try {
      fn(isSupabaseConfigured);
    } catch (err) {
      console.error(err);
    }
  });
}

export function clearCustomSupabaseCredentials() {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  } catch {
    // ignore
  }
  activeCreds = {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY,
  };
  SUPABASE_URL = activeCreds.url;
  SUPABASE_ANON_KEY = activeCreds.key;
  isSupabaseConfigured = true;
  supabase = createClientInstance();

  listeners.forEach((fn) => {
    try {
      fn(isSupabaseConfigured);
    } catch (err) {
      console.error(err);
    }
  });
}

/**
 * Validate Supabase connection status
 */
export async function testSupabaseConnection(
  targetUrl?: string,
  targetKey?: string
): Promise<{ success: boolean; message: string; tableMissing?: boolean }> {
  const url = cleanSupabaseUrl(targetUrl) || SUPABASE_URL;
  const key = targetKey?.trim() || SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { success: false, message: 'กรุณาระบุ Supabase URL และ Anon Key' };
  }

  if (!isValidHttpUrl(url)) {
    return {
      success: false,
      message: 'URL ของ Supabase ต้องขึ้นต้นด้วย https:// และเป็น URL ที่ถูกต้อง',
    };
  }

  try {
    const client = createClient(url, key);
    const { error } = await client.from('team_rosters').select('id').limit(1);

    if (error) {
      // 42P01: Postgres undefined_table
      // PGRST205: PostgREST schema cache missing table
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return {
          success: true,
          tableMissing: true,
          message:
            'เชื่อมต่อ Supabase สำเร็จแล้ว! แต่ยังไม่พบตาราง team_rosters ในฐานข้อมูล (กรุณากดคัดลอก SQL ด้านล่างไปรันใน Supabase SQL Editor)',
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return {
      success: true,
      tableMissing: false,
      message: 'เชื่อมต่อ Supabase สำเร็จ และพบตารางพร้อมใช้งานเรียบร้อย!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'ไม่สามารถติดต่อ Supabase ได้ กรุณาตรวจสอบ Network',
    };
  }
}

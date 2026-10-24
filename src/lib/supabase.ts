import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'ticktick_supabase_url';
const STORAGE_ANON_KEY = 'ticktick_supabase_anon_key';
const STORAGE_DISCONNECTED_KEY = 'ticktick_supabase_disconnected';

export const DEFAULT_SUPABASE_URL = 'https://tnvhzivoehqqlspqqyvu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_a3N-YXwCN0aWQYTAXa9yUA_L3_XRluH';

export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'runtime' | 'default' | 'none';
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseConfig(): SupabaseConnectionConfig {
  if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_DISCONNECTED_KEY) === 'true') {
    return {
      url: '',
      anonKey: '',
      isConfigured: false,
      source: 'none',
    };
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const runtimeUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const runtimeKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  if (runtimeUrl && runtimeKey) {
    return {
      url: runtimeUrl.trim(),
      anonKey: runtimeKey.trim(),
      isConfigured: true,
      source: 'runtime',
    };
  }

  if (
    envUrl &&
    envKey &&
    !envUrl.includes('your-project-id') &&
    !envKey.includes('your-supabase-anon-key')
  ) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConfigured: true,
    source: 'default',
  };
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string) {
  if (!url.trim() || !anonKey.trim()) {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    localStorage.setItem(STORAGE_DISCONNECTED_KEY, 'true');
  } else {
    localStorage.removeItem(STORAGE_DISCONNECTED_KEY);
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  }
  cachedClient = null;
  cachedConfigKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) return null;

  const key = `${cfg.url}::${cfg.anonKey}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    cachedConfigKey = key;
    return cachedClient;
  } catch {
    return null;
  }
}

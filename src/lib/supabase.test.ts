import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  getSupabaseConfig,
  saveRuntimeSupabaseConfig,
} from './supabase';

describe('Supabase Client Configuration Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly reports default credentials when no custom config is stored', () => {
    const config = getSupabaseConfig();
    expect(config.url).toBe(DEFAULT_SUPABASE_URL);
    expect(config.anonKey).toBe(DEFAULT_SUPABASE_ANON_KEY);
    expect(config.isConfigured).toBe(true);
    expect(config.source).toBe('default');
  });

  it('persists and retrieves custom runtime credentials in localStorage', () => {
    const customUrl = 'https://custom-project-id.supabase.co';
    const customKey = 'sb_publishable_custom_key_xyz_123';

    saveRuntimeSupabaseConfig(customUrl, customKey);
    const updated = getSupabaseConfig();
    expect(updated.url).toBe(customUrl);
    expect(updated.anonKey).toBe(customKey);
    expect(updated.isConfigured).toBe(true);
    expect(updated.source).toBe('runtime');

    // Passing empty values marks it as explicitly disconnected
    saveRuntimeSupabaseConfig('', '');
    const disconnected = getSupabaseConfig();
    expect(disconnected.isConfigured).toBe(false);
    expect(disconnected.source).toBe('none');
  });
});

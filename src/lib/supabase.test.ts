import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_SUPABASE_ANON_KEY,
  DEMO_SUPABASE_URL,
  getSupabaseConfig,
  hasDismissedDatabasePrompt,
  resetDatabasePrompt,
  saveRuntimeSupabaseConfig,
  setDatabasePromptDismissed,
} from './supabase';

describe('Supabase Client Configuration Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does NOT auto-connect new users to any shared database by default', () => {
    // New users must start with local-only storage until they provide their own credentials
    const config = getSupabaseConfig();
    expect(config.url).toBe('');
    expect(config.anonKey).toBe('');
    expect(config.isConfigured).toBe(false);
    expect(config.source).toBe('none');
    expect(hasDismissedDatabasePrompt()).toBe(false);
  });

  it('persists and retrieves custom runtime credentials in the same browser', () => {
    const customUrl = 'https://custom-project-id.supabase.co';
    const customKey = 'sb_publishable_custom_key_xyz_123';

    saveRuntimeSupabaseConfig(customUrl, customKey);
    const updated = getSupabaseConfig();
    expect(updated.url).toBe(customUrl);
    expect(updated.anonKey).toBe(customKey);
    expect(updated.isConfigured).toBe(true);
    expect(updated.source).toBe('runtime');
    expect(hasDismissedDatabasePrompt()).toBe(true);

    // Calling again simulates page reload in the same browser
    const reloaded = getSupabaseConfig();
    expect(reloaded.url).toBe(customUrl);
    expect(reloaded.anonKey).toBe(customKey);
    expect(reloaded.isConfigured).toBe(true);

    // Passing empty values marks it as explicitly disconnected
    saveRuntimeSupabaseConfig('', '');
    const disconnected = getSupabaseConfig();
    expect(disconnected.isConfigured).toBe(false);
    expect(disconnected.source).toBe('none');
  });

  it('manages database setup prompt dismissed state correctly', () => {
    expect(hasDismissedDatabasePrompt()).toBe(false);
    setDatabasePromptDismissed();
    expect(hasDismissedDatabasePrompt()).toBe(true);
    resetDatabasePrompt();
    expect(hasDismissedDatabasePrompt()).toBe(false);
  });

  it('provides demo credentials constants for optional test-drive', () => {
    expect(DEMO_SUPABASE_URL).toContain('supabase.co');
    expect(DEMO_SUPABASE_ANON_KEY).toBeTruthy();
  });
});

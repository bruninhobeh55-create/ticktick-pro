import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  ExternalLink,
  HardDrive,
  HelpCircle,
  Loader2,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  DEMO_SUPABASE_ANON_KEY,
  DEMO_SUPABASE_URL,
  getSupabaseConfig,
  setDatabasePromptDismissed,
} from '../lib/supabase';

export const DatabaseSetupPromptModal: React.FC = () => {
  const {
    isDatabasePromptOpen,
    setIsDatabasePromptOpen,
    connectSupabase,
    pushToast,
  } = useApp();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Sync existing config if available
  useEffect(() => {
    if (isDatabasePromptOpen) {
      const cfg = getSupabaseConfig();
      if (cfg.url) setUrl(cfg.url);
      if (cfg.anonKey) setAnonKey(cfg.anonKey);
    }
  }, [isDatabasePromptOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDatabasePromptOpen) {
        handleUseLocalStorage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDatabasePromptOpen]);

  if (!isDatabasePromptOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setErrorMessage('Please provide both your Supabase Project URL and Anon API Key.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const success = await connectSupabase(url.trim(), anonKey.trim());
      if (success) {
        setDatabasePromptDismissed();
        setIsDatabasePromptOpen(false);
        pushToast({
          title: 'Database Connected Successfully',
          description: 'Your private Supabase cloud backend is configured and ready.',
          kind: 'success',
        });
      } else {
        setErrorMessage(
          'Failed to connect to this Supabase project. Please verify the URL and anon key, and ensure your project is active.'
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Connection error. Please check your network and Supabase settings.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseLocalStorage = () => {
    setDatabasePromptDismissed();
    setIsDatabasePromptOpen(false);
    pushToast({
      title: 'Operating in Private Local Storage',
      description: 'Your data remains 100% offline in this browser. You can connect a database anytime in Settings.',
      kind: 'info',
    });
  };

  const handleFillDemo = () => {
    setUrl(DEMO_SUPABASE_URL);
    setAnonKey(DEMO_SUPABASE_ANON_KEY);
    setErrorMessage(null);
    pushToast({
      title: 'Demo Credentials Filled',
      description: 'Click "Connect & Sync Database" to connect to the shared demo project.',
      kind: 'info',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="db-setup-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200/90 overflow-hidden text-zinc-900 my-auto">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={handleUseLocalStorage}
          title="Dismiss and use local storage"
          aria-label="Close dialog and use local storage"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="db-setup-title" className="text-lg font-bold text-zinc-900">
                  Connect Your Database
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3" /> Private by default
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Every user has their own private workspace. To sync your tasks across phone and PC, provide your own Supabase project link below, or continue with private local storage.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-3.5">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  required
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
              </div>

              {/* Instructions toggle & demo project fill */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showInstructions ? 'Hide setup instructions' : 'How to get free Supabase keys?'}
                </button>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 text-[11px]"
                  title="Fill demo project credentials for quick testing"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Try Demo DB
                </button>
              </div>

              {/* Expandable guide */}
              {showInstructions && (
                <div className="p-3 bg-white rounded-lg border border-zinc-200 text-xs text-zinc-600 space-y-1.5 animate-in fade-in duration-150">
                  <div className="font-semibold text-zinc-800 flex items-center justify-between">
                    <span>How to create your free Supabase database:</span>
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-600 text-[11.5px]">
                    <li>Sign up or log in at <strong>supabase.com</strong> (100% free tier).</li>
                    <li>Click <strong>New Project</strong> and select a region close to you.</li>
                    <li>Go to <strong>Project Settings → API</strong>.</li>
                    <li>Copy the <strong>Project URL</strong> and <strong>Project API key (anon / public)</strong> into the boxes above.</li>
                  </ol>
                  <p className="text-[11px] text-zinc-500 pt-1">
                    Once connected, your tasks and habits sync in real-time between your devices using your own dedicated database.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-snug">
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting to Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connect & Sync Database
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleUseLocalStorage}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                Use Local Storage Only
              </button>
            </div>
          </form>

          {/* Subtext info */}
          <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Details are saved in this browser for future visits.</span>
            <span>Can be changed in Settings anytime.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

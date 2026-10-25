import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Download, RefreshCw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleDownloadBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ticktick_') || key.startsWith('supabase_'))) {
          try {
            backupData[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            backupData[key] = localStorage.getItem(key);
          }
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticktick-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not generate backup: ' + (err as Error).message);
    }
  };

  private handleClearCache = () => {
    if (confirm('This will reset your local cached data. Ensure you have downloaded a backup first. Proceed?')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ticktick_pro_v2_')) {
          localStorage.removeItem(key);
        }
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const module = this.props.moduleName || 'Application';
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[400px] bg-zinc-50">
          <div className="max-w-md w-full surface-card rounded-2xl p-6 sm:p-8 border border-zinc-200/90 shadow-xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                {module} Encountered an Error
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                An unexpected runtime condition occurred. Your data in storage is safe. You can reload, safely return home, or save an offline backup.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-zinc-100/80 rounded-lg p-2.5 text-[11px] font-mono border border-zinc-200/80 max-h-32 overflow-y-auto text-zinc-700">
                <summary className="font-semibold cursor-pointer text-zinc-600 hover:text-zinc-900 select-none">
                  Technical Error Details
                </summary>
                <div className="mt-2 text-rose-700 font-medium whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-1 text-zinc-500 text-[10px] whitespace-pre-wrap break-all">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>

              {this.props.onReset ? (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    this.props.onReset?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  Return to Tasks
                </button>
              ) : (
                <button
                  type="button"
                  onClick={this.handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Backup
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
              <button
                type="button"
                onClick={this.handleDownloadBackup}
                className="hover:text-zinc-700 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Save JSON Backup
              </button>
              <button
                type="button"
                onClick={this.handleClearCache}
                className="hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear Corrupt Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { useState } from 'react';
import { CheckCircle2, Info, Sparkles, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  kind?: 'success' | 'info' | 'action';
  onUndo?: () => void;
}

interface SonnerToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

/**
 * Emil Kowalski Sonner-Style Stacked Toast Component
 * - Uses 3D vertical stacking with scale() + translateY()
 * - Expands into a list on hover using --ease-out-quint (cubic-bezier(0.23, 1, 0.32, 1))
 */
export const SonnerToaster: React.FC<SonnerToasterProps> = ({ toasts, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (toasts.length === 0) return null;

  const visibleToasts = toasts.slice(0, 3);

  return (
    <div
      role="region"
      aria-label="Notifications"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-16 right-3 left-3 sm:left-auto sm:bottom-4 sm:right-4 z-50 sm:w-80 pointer-events-none flex flex-col items-end"
    >
      <div className="relative w-full h-24">
        {visibleToasts.map((toast, index) => {
          const offset = isHovered ? index * -62 : index * -10;
          const scale = isHovered ? 1 : 1 - index * 0.045;
          const opacity = index > 2 ? 0 : 1 - (isHovered ? 0 : index * 0.15);

          return (
            <div
              key={toast.id}
              style={{
                transform: `translate3d(0, ${offset}px, 0) scale(${scale})`,
                opacity,
                zIndex: 50 - index,
                transition:
                  'transform 260ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.165, 0.84, 0.44, 1)',
              }}
              className="pointer-events-auto absolute bottom-0 right-0 w-full surface-floating rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {toast.kind === 'action' ? (
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={1.75} />
                ) : toast.kind === 'info' ? (
                  <Info className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.75} />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 truncate">{toast.title}</div>
                  {toast.description && (
                    <div className="text-[11px] text-zinc-500 truncate">{toast.description}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {toast.onUndo && (
                  <button
                    onClick={() => {
                      toast.onUndo?.();
                      onDismiss(toast.id);
                    }}
                    className="px-2 py-1 rounded-md bg-zinc-900 text-white text-[11px] font-medium hover:bg-zinc-800"
                  >
                    Undo
                  </button>
                )}
                <button
                  onClick={() => onDismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

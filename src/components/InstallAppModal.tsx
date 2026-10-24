import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Laptop,
  PlusSquare,
  Share2,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getPwaState,
  promptPwaInstall,
  subscribePwaState,
} from '../pwa/pwaManager';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [pwaState, setPwaState] = useState(getPwaState());
  const [installResult, setInstallResult] = useState<string | null>(null);

  useEffect(() => {
    return subscribePwaState((state) => {
      setPwaState(state);
    });
  }, []);

  if (!isOpen) return null;

  const isStandalone = pwaState.isInstalled;
  const isIOS = pwaState.isIOS;

  const handleInstallClick = async () => {
    const outcome = await promptPwaInstall();
    if (outcome === 'accepted') {
      setInstallResult('App successfully installed! You can now launch it from your home screen.');
      setTimeout(() => {
        onClose();
      }, 2500);
    } else if (outcome === 'dismissed') {
      setInstallResult('Installation dismissed. You can install anytime from Settings.');
    } else if (outcome === 'manual_ios') {
      // iOS doesn't support programmatic prompt, guided flow shown below
    } else if (outcome === 'unavailable') {
      setInstallResult(
        'Direct prompt unavailable. If on Chrome/Edge, click the install icon in the URL bar (⊕) or add to home screen.'
      );
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-b border-zinc-100">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 flex items-center justify-center text-white p-2">
              <img src="./app-icon.svg" alt="TickTick Pro" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold text-zinc-900 tracking-tight">TickTick Pro</h3>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
                  Mobile App
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Progressive Web App • Install on Android, iPhone & PC
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {isStandalone ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold block mb-0.5">App is Installed & Active</span>
                You are currently running TickTick Pro in standalone native app mode with offline storage and instant reminders.
              </div>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-700">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Full-screen UI without browser bars</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-700">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Offline cache & instant launch</span>
                </div>
              </div>

              {/* iOS Safari Instructions */}
              {isIOS ? (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-zinc-800">
                    How to install on iPhone & iPad:
                  </div>
                  <ol className="space-y-2.5 text-xs text-zinc-600 bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-100">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-zinc-800">Share</strong> icon (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />) at the bottom of Safari
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                        2
                      </span>
                      <span>
                        Scroll down and tap <strong className="text-zinc-800">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-zinc-700" />)
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-zinc-800">Add</strong> in the top-right corner
                      </span>
                    </li>
                  </ol>
                  <p className="text-[11px] text-zinc-400">
                    Once added, launch TickTick Pro from your home screen for the full app experience.
                  </p>
                </div>
              ) : (
                /* Android & Desktop Chromium One-Click Install */
                <div className="space-y-3">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Install TickTick Pro directly to your home screen or desktop application menu. No app store download needed.
                  </p>

                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on this Device</span>
                  </button>

                  {installResult && (
                    <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] text-center">
                      {installResult}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" /> Android Phone & Tablet
                    </span>
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3.5 h-3.5" /> Windows, Mac & Chromebook
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

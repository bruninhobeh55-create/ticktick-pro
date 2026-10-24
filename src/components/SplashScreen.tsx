import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRight, CheckCircle2, Flame, Sparkles, Timer, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PRODUCTIVITY_QUOTES = [
  'Focus on being productive instead of busy.',
  'Small daily disciplines compound into massive achievements.',
  'Your future is built by what you do today, not tomorrow.',
  'Prioritize ruthlessly. Execute cleanly.',
  'Clarity of mind brings speed of execution.',
  'Momentum is created one completed task at a time.',
];

export const SplashScreen: React.FC = () => {
  const { preferences, tasks, habits } = useApp();
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(15);
  const [quote] = useState(() => {
    const index = Math.floor(Math.random() * PRODUCTIVITY_QUOTES.length);
    return PRODUCTIVITY_QUOTES[index];
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'trash' &&
      t.status !== 'wont_do' &&
      (t.dueDate === todayStr || t.priority >= 3)
  );

  const activeHabitsCount = habits.length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = preferences?.fullName || 'Workspace';

  useEffect(() => {
    // Smooth progress fill
    const progressTimer1 = setTimeout(() => setProgress(45), 250);
    const progressTimer2 = setTimeout(() => setProgress(85), 650);
    const progressTimer3 = setTimeout(() => setProgress(100), 1050);

    // Fade out transition
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1350);

    // Unmount from DOM
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1850);

    return () => {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-8 select-none bg-[#09090b] text-white transition-all duration-500 ease-out ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-600/15 blur-[90px] pointer-events-none" />

      {/* Top Bar: Date & Status Pill */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-zinc-400 z-10 pt-safe">
        <span className="font-mono tracking-tight text-zinc-400">
          {format(new Date(), 'EEEE, MMMM d')}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 text-[11px] font-medium border border-white/10 transition-colors"
        >
          <span>Skip</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Center Stage: Glowing App Icon, Greeting & Workspace Preview */}
      <div className="flex flex-col items-center text-center max-w-sm z-10 my-auto space-y-6">
        {/* App Icon with Breathing Halo */}
        <div className="relative group">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-30 blur-xl group-hover:opacity-50 transition duration-1000 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-3.5 shadow-2xl shadow-blue-500/30 border border-white/20 flex items-center justify-center transform transition duration-500 hover:scale-105">
            <img
              src="./app-icon.svg"
              alt="TickTick Pro"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Brand Name & Greeting */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Precision Productivity</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 font-light italic px-4 leading-relaxed">
            "{quote}"
          </p>
        </div>

        {/* Live Workspace Snapshot Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              {todayTasks.length > 0 ? `${todayTasks.length} tasks ready` : 'Zero inbox clean'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-zinc-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{activeHabitsCount} habits active</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-zinc-300">
            <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Focus ready</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="w-full max-w-xs space-y-2 z-10 pb-safe">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            <span>Loading workspace state...</span>
          </span>
          <span className="font-mono">{progress}%</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/[0.05]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-400 transition-all duration-500 ease-out shadow-sm shadow-blue-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

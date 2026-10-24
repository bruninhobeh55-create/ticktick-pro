import React from 'react';
import { BellRing, Check, Clock, RotateCcw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ActiveReminderModal: React.FC = () => {
  const { activeReminder, dismissActiveReminder, snoozeActiveReminder, toggleTaskStatus } =
    useApp();

  if (!activeReminder) return null;

  const { task, reminderLabel, triggeredAt, isConstant } = activeReminder;

  return (
    <div
      role="alertdialog"
      aria-labelledby="reminder-title"
      aria-describedby="reminder-desc"
      className="fixed inset-0 z-[120] bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm surface-floating rounded-2xl bg-white border border-zinc-200/90 shadow-2xl p-5 space-y-4 animate-modal overflow-hidden"
      >
        {/* Header with pulsing bell */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isConstant
                  ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-500/20 animate-pulse'
                  : 'bg-amber-50 text-amber-600 ring-2 ring-amber-500/20'
              }`}
            >
              <BellRing className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-num flex items-center gap-1">
                {reminderLabel || 'Reminder'} • {triggeredAt}
              </span>
              <h3
                id="reminder-title"
                className="text-sm font-bold text-zinc-900 line-clamp-2 leading-snug mt-0.5"
              >
                {task.title}
              </h3>
            </div>
          </div>
          <button
            onClick={dismissActiveReminder}
            aria-label="Dismiss alert"
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Details & Constant Alert Callout */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="flex items-center gap-1 font-mono-num">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Due: {task.dueDate || 'Today'} {task.startTime ? `@ ${task.startTime}` : ''}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                task.priority === 5
                  ? 'bg-rose-100 text-rose-700'
                  : task.priority === 3
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              P{task.priority || 0}
            </span>
          </div>

          {isConstant && (
            <p className="text-[11px] font-medium text-rose-700 pt-1">
              ⚡ Constant Reminder active — chimes every 25s until snoozed or marked complete.
            </p>
          )}
        </div>

        {/* Actions: Complete, Snooze, Dismiss */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              toggleTaskStatus(task.id);
              dismissActiveReminder();
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Mark Task Complete
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => snoozeActiveReminder(5)}
              className="py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              5m
            </button>
            <button
              type="button"
              onClick={() => snoozeActiveReminder(15)}
              className="py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              15m
            </button>
            <button
              type="button"
              onClick={dismissActiveReminder}
              className="py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

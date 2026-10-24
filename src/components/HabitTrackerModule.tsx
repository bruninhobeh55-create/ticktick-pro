import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  Award,
  Check,
  Flame,
  MessageSquarePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Habit, HabitLogEntry } from '../types';
import { HABIT_ICON_KEYS, UiIcon } from './UiIcon';

export const HabitTrackerModule: React.FC = () => {
  const {
    habits,
    addHabit,
    updateHabit,
    toggleHabitDate,
    deleteHabitLog,
    clearHabitLogs,
    deleteHabit,
    rightPaneWidth,
    setRightPaneWidth,
  } = useApp();

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(habits[0]?.id || null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [icon, setIcon] = useState('flame');
  const [color, setColor] = useState('#10b981');
  const [section, setSection] = useState<Habit['section']>('morning');
  const [goalType, setGoalType] = useState<Habit['goalType']>('check');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('times');

  // Habit Log Filter State
  const [habitLogRange, setHabitLogRange] = useState<'all' | '7days' | '30days'>('all');
  const [habitMoodFilter, setHabitMoodFilter] = useState<'all' | 'great' | 'good' | 'neutral' | 'tired'>('all');
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = rightPaneWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      setRightPaneWidth(startWidth + (startX - moveEvent.clientX));
    };
    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const [logModalTarget, setLogModalTarget] = useState<{ habitId: string; dateStr: string } | null>(
    null
  );
  const [logMood, setLogMood] = useState<HabitLogEntry['mood']>('great');
  const [logNote, setLogNote] = useState('');

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i)),
    []
  );

  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const dStr = format(subDays(today, i), 'yyyy-MM-dd');
      if (habit.logs[dStr]?.completed) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const selectedHabit =
    habits.find((h) => h.id === selectedHabitId) ||
    (typeof window !== 'undefined' && window.innerWidth >= 1024 ? habits[0] : null);

  const openEditHabitModal = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setName(habit.name);
    setQuote(habit.quote);
    setIcon(habit.icon);
    setColor(habit.color);
    setSection(habit.section);
    setGoalType(habit.goalType);
    setTargetValue(habit.targetValue);
    setUnit(habit.unit);
    setShowNewModal(true);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingHabitId) {
      updateHabit(editingHabitId, {
        name: name.trim(),
        quote: quote.trim() || 'Small daily improvements lead to lasting compound results.',
        icon,
        color,
        section,
        goalType,
        targetValue: goalType === 'check' ? 1 : targetValue,
        unit: goalType === 'check' ? 'times' : unit,
      });
    } else {
      addHabit({
        name: name.trim(),
        quote: quote.trim() || 'Small daily improvements lead to lasting compound results.',
        icon,
        color,
        section,
        frequencyType: 'daily',
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        frequencyCount: 7,
        goalType,
        targetValue: goalType === 'check' ? 1 : targetValue,
        unit: goalType === 'check' ? 'times' : unit,
        autoPopLog: true,
      });
    }
    setName('');
    setQuote('');
    setEditingHabitId(null);
    setShowNewModal(false);
  };

  const sections: { id: Habit['section']; label: string; iconKey: string }[] = [
    { id: 'morning', label: 'Morning Routine', iconKey: 'sunrise' },
    { id: 'afternoon', label: 'Afternoon', iconKey: 'sun' },
    { id: 'evening', label: 'Evening', iconKey: 'moon' },
    { id: 'anytime', label: 'Anytime', iconKey: 'zap' },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-white overflow-y-auto lg:overflow-hidden">
      {/* Main Habit Check-in Matrix */}
      <div className="flex-1 flex flex-col lg:h-full lg:overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
              <Flame className="w-4 h-4 text-orange-500 shrink-0" strokeWidth={1.75} />
              Habit Tracker ({habits.length}/299)
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tap any day circle to check in or increment quantified goals (ml, pages, mins).
            </p>
          </div>
          <button
            onClick={() => {
              setEditingHabitId(null);
              setName('');
              setQuote('');
              setShowNewModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} /> New Habit
          </button>
        </div>

        {/* 7-Day Column Header & Matrix (Horizontally scrollable on narrow mobile screens) */}
        <div className="surface-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">
              <div className="grid grid-cols-[minmax(170px,1fr)_repeat(7,40px)_64px] items-center bg-zinc-50 px-4 py-2.5 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-500">
                <div>
                  Habit & Daily Goal
                  <span className="sm:hidden font-normal text-[10px] text-zinc-400 ml-1">
                    (← swipe days →)
                  </span>
                </div>
                {last7Days.map((d) => {
                  const dStr = format(d, 'yyyy-MM-dd');
                  return (
                    <div
                      key={dStr}
                      className={`text-center ${
                        dStr === todayStr ? 'text-zinc-900 font-bold' : ''
                      }`}
                    >
                      <div>{format(d, 'EEE')}</div>
                      <div className="font-mono-num text-[10px]">{format(d, 'd')}</div>
                    </div>
                  );
                })}
                <div className="text-right">Streak</div>
              </div>

              {/* Grouped by Time of Day */}
              <div className="divide-y divide-zinc-100">
                {sections.map((sec) => {
                  const secHabits = habits.filter((h) => h.section === sec.id);
                  if (secHabits.length === 0) return null;

                  return (
                    <div key={sec.id}>
                      <div className="px-4 py-1.5 bg-zinc-50/70 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <UiIcon name={sec.iconKey} className="w-3 h-3 text-zinc-400" />
                        {sec.label}
                      </div>
                      {secHabits.map((habit) => {
                        const streak = calculateStreak(habit);
                        const isSelected = selectedHabit?.id === habit.id;

                        return (
                          <div
                            key={habit.id}
                            onClick={() => setSelectedHabitId(habit.id)}
                            className={`grid grid-cols-[minmax(170px,1fr)_repeat(7,40px)_64px] items-center px-4 py-3 cursor-pointer ${
                              isSelected ? 'bg-zinc-900/[0.03]' : 'hover:bg-zinc-50/70'
                            }`}
                          >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span
                            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-black/[0.04]"
                          >
                            <UiIcon name={habit.icon} className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 truncate">
                              {habit.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate font-mono-num">
                              {habit.goalType === 'quantified'
                                ? `Goal: ${habit.targetValue} ${habit.unit}/day`
                                : habit.quote}
                            </div>
                          </div>
                        </div>

                        {last7Days.map((d) => {
                          const dStr = format(d, 'yyyy-MM-dd');
                          const entry = habit.logs[dStr];
                          const isCompleted = entry?.completed;
                          const partialPct =
                            habit.goalType === 'quantified' && entry
                              ? Math.min(100, Math.round((entry.value / habit.targetValue) * 100))
                              : isCompleted
                                ? 100
                                : 0;

                          return (
                            <div key={dStr} className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHabitDate(habit.id, dStr);
                                }}
                                title={
                                  entry
                                    ? `${entry.value}/${habit.targetValue} ${habit.unit}`
                                    : 'Click to check in'
                                }
                                style={{
                                  backgroundColor: isCompleted
                                    ? habit.color
                                    : partialPct > 0
                                      ? `${habit.color}26`
                                      : undefined,
                                  borderColor:
                                    isCompleted || partialPct > 0 ? habit.color : undefined,
                                }}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono-num font-bold ${
                                  isCompleted
                                    ? 'text-white'
                                    : partialPct > 0
                                      ? 'text-zinc-900'
                                      : 'border-zinc-200 hover:border-zinc-400 text-zinc-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[2.75] animate-check" />
                                ) : partialPct > 0 ? (
                                  `${partialPct}%`
                                ) : (
                                  ''
                                )}
                              </button>
                            </div>
                          );
                        })}

                        <div className="text-right font-mono-num text-xs font-semibold text-zinc-800 flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                          {streak}d
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Selected Habit Statistics, Streak & Mood/Thought Log */}
      {selectedHabit && (
        <aside
          style={{ '--right-pane-width': `${rightPaneWidth}px` } as React.CSSProperties}
          className="w-full lg:w-[var(--right-pane-width)] relative border-t lg:border-t-0 lg:border-l border-zinc-200/80 bg-zinc-50/50 p-4 sm:p-6 flex flex-col space-y-5 lg:overflow-y-auto shrink-0"
        >
          {/* PC Left-Edge Drag Resize Handle */}
          <div
            onMouseDown={handleMouseDownResize}
            title="Drag to resize right inspector (280px – 680px)"
            aria-label="Resize Habit Inspector"
            className="hidden lg:flex absolute inset-y-0 left-0 w-2 cursor-col-resize items-center justify-center group z-20 hover:bg-blue-500/10"
          >
            <div
              className={`w-[2px] h-10 rounded-full transition-colors ${
                isResizing ? 'bg-blue-600' : 'bg-zinc-200/80 group-hover:bg-blue-600'
              }`}
            />
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span
                style={{ backgroundColor: `${selectedHabit.color}18`, color: selectedHabit.color }}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/[0.04] shrink-0"
              >
                <UiIcon name={selectedHabit.icon} className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900 truncate">{selectedHabit.name}</h2>
                <p className="text-[11px] text-zinc-500 italic truncate">"{selectedHabit.quote}"</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEditHabitModal(selectedHabit)}
                title="Edit Habit"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60"
              >
                <Pencil className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => deleteHabit(selectedHabit.id)}
                title="Delete Habit"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setSelectedHabitId(null)}
                title="Close Inspector"
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Current Streak
              </div>
              <div className="text-xl font-bold font-mono-num text-zinc-900 mt-1 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                {calculateStreak(selectedHabit)} Days
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Total Check-ins
              </div>
              <div className="text-xl font-bold font-mono-num text-emerald-600 mt-1 flex items-center gap-1.5">
                <Award className="w-4 h-4" strokeWidth={1.75} />
                {Object.values(selectedHabit.logs).filter((l) => l.completed).length} Days
              </div>
            </div>
          </div>

          {/* Add Mood & Thought Log for Today */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5 font-mono-num">
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                Today ({todayStr})
              </span>
              <div className="flex items-center gap-2">
                {selectedHabit.logs[todayStr] && (
                  <button
                    type="button"
                    onClick={() => deleteHabitLog(selectedHabit.id, todayStr)}
                    title="Remove today's check-in"
                    className="text-[11px] text-rose-600 font-semibold hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.75} /> Remove
                  </button>
                )}
                <button
                  onClick={() => setLogModalTarget({ habitId: selectedHabit.id, dateStr: todayStr })}
                  className="text-[11px] text-zinc-700 font-semibold hover:text-zinc-900 flex items-center gap-1"
                >
                  <MessageSquarePlus className="w-3 h-3" strokeWidth={1.75} /> Log Reflection
                </button>
              </div>
            </div>

            {selectedHabit.goalType === 'quantified' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className="text-zinc-600">
                    Logged: {selectedHabit.logs[todayStr]?.value || 0} / {selectedHabit.targetValue}{' '}
                    {selectedHabit.unit}
                  </span>
                  <button
                    onClick={() => toggleHabitDate(selectedHabit.id, todayStr)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold"
                  >
                    + Add {Math.max(1, Math.round(selectedHabit.targetValue / 4))}{' '}
                    {selectedHabit.unit}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => toggleHabitDate(selectedHabit.id, todayStr)}
                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  selectedHabit.logs[todayStr]?.completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                }`}
              >
                {selectedHabit.logs[todayStr]?.completed ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Completed Today
                  </>
                ) : (
                  'Mark Today Complete'
                )}
              </button>
            )}
          </div>

          {/* Habit Check-in Journal Logs with Filters & Delete Actions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Habit Journal & Mood Logs ({Object.keys(selectedHabit.logs).length})
              </h3>
              {Object.keys(selectedHabit.logs).length > 0 && (
                <button
                  type="button"
                  onClick={() => clearHabitLogs(selectedHabit.id)}
                  className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 px-1.5 py-0.5 rounded hover:bg-rose-50"
                >
                  Clear History
                </button>
              )}
            </div>

            {/* Filter Bar: Date Range & Mood */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70">
                {(
                  [
                    ['all', 'All'],
                    ['7days', '7 Days'],
                    ['30days', '30 Days'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHabitLogRange(id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      habitLogRange === id
                        ? 'bg-white text-zinc-900 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <select
                aria-label="Filter habit logs by mood"
                value={habitMoodFilter}
                onChange={(e) => setHabitMoodFilter(e.target.value as typeof habitMoodFilter)}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-zinc-200/80 bg-white text-zinc-700 focus:outline-none"
              >
                <option value="all">All Moods</option>
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="neutral">Neutral</option>
                <option value="tired">Tired</option>
              </select>
            </div>

            {(() => {
              const cutoff7 = format(subDays(today, 7), 'yyyy-MM-dd');
              const cutoff30 = format(subDays(today, 30), 'yyyy-MM-dd');
              const filteredLogs = Object.entries(selectedHabit.logs)
                .filter(([dateKey, log]) => {
                  if (habitLogRange === '7days' && dateKey < cutoff7) return false;
                  if (habitLogRange === '30days' && dateKey < cutoff30) return false;
                  if (habitMoodFilter !== 'all' && (log.mood || 'great') !== habitMoodFilter) {
                    return false;
                  }
                  return true;
                })
                .sort(([a], [b]) => b.localeCompare(a));

              if (filteredLogs.length === 0) {
                return (
                  <div className="text-center py-6 text-xs text-zinc-400 bg-white rounded-xl border border-zinc-200/70">
                    No habit logs match the active filter.
                  </div>
                );
              }

              return filteredLogs.map(([dateKey, log]) => (
                <div
                  key={dateKey}
                  className="group p-3 rounded-xl bg-white border border-zinc-200/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num font-semibold text-zinc-700">{dateKey}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium capitalize">
                        {log.value} {selectedHabit.unit} • {log.mood || 'great'}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteHabitLog(selectedHabit.id, dateKey)}
                        title={`Delete habit log for ${dateKey}`}
                        aria-label={`Delete habit log ${dateKey}`}
                        className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  {log.note && <p className="text-zinc-500">{log.note}</p>}
                </div>
              ));
            })()}
          </div>
        </aside>
      )}

      {/* Modal: Create Habit */}
      {showNewModal && (
        <div
          onClick={() => setShowNewModal(false)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateHabit}
            className="surface-floating rounded-xl w-full max-w-md p-5 space-y-4 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">
              {editingHabitId ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Habit Name</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Practice Guitar 20m"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_ICON_KEYS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIcon(item.key)}
                    title={item.label}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      icon === item.key
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <UiIcon name={item.key} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Motivational Quote
              </label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Why does this habit matter to you?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Time of Day</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as Habit['section'])}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Goal Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as Habit['goalType'])}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="check">Achieve All (1 Check)</option>
                  <option value="quantified">Reach Quantified Amount</option>
                </select>
              </div>
            </div>

            {goalType === 'quantified' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Daily Target
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="ml, pages, mins"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Accent Color</label>
              <div className="flex gap-2">
                {['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#ef4444'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full ${
                      color === c ? 'ring-2 ring-offset-2 ring-zinc-900' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {editingHabitId ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Habit Mood & Reflection Log */}
      {logModalTarget && (
        <div
          onClick={() => setLogModalTarget(null)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              toggleHabitDate(
                logModalTarget.habitId,
                logModalTarget.dateStr,
                undefined,
                logNote,
                logMood
              );
              setLogNote('');
              setLogModalTarget(null);
            }}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-3 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">Habit Check-in Reflection</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">How did it feel?</label>
              <select
                value={logMood}
                onChange={(e) => setLogMood(e.target.value as HabitLogEntry['mood'])}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
              >
                <option value="great">Great / Energized</option>
                <option value="good">Good / Steady</option>
                <option value="neutral">Neutral</option>
                <option value="tired">Tired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Journal Note</label>
              <textarea
                rows={3}
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Write a quick reflection on your streak..."
                className="w-full p-2.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogModalTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Save Check-in
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

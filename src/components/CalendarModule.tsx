import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskDetailPane } from './TaskDetailPane';

type CalendarSubView = 'month' | 'week' | 'day' | 'multiday' | 'agenda';

export const CalendarModule: React.FC = () => {
  const {
    tasks,
    lists,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    updateTask,
    toggleTaskStatus,
    calendarSubscriptions,
    addCalendarSubscription,
    toggleCalendarSubscription,
  } = useApp();

  const [subView, setSubView] = useState<CalendarSubView>('month');
  const [cursorDate, setCursorDate] = useState<Date>(startOfToday());
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
    return true;
  });
  const [showSubModal, setShowSubModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subUrl, setSubUrl] = useState('');
  const [subProvider, setSubProvider] = useState<'google' | 'outlook' | 'apple' | 'ics'>('google');
  const [quickCellDate, setQuickCellDate] = useState<string | null>(null);
  const [quickCellTitle, setQuickCellTitle] = useState('');

  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'trash' && t.status !== 'wont_do'),
    [tasks]
  );

  const unscheduledTasks = useMemo(
    () => activeTasks.filter((t) => !t.dueDate && t.status !== 'completed'),
    [activeTasks]
  );

  const externalEvents = useMemo(
    () =>
      calendarSubscriptions
        .filter((s) => s.enabled)
        .flatMap((s) =>
          s.events.map((ev) => ({
            ...ev,
            color: s.color,
            calendarName: s.name,
          }))
        ),
    [calendarSubscriptions]
  );

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursorDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursorDate]);

  const multiDays = useMemo(
    () => Array.from({ length: 3 }, (_, i) => addDays(cursorDate, i)),
    [cursorDate]
  );

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

  const handleNavigate = (dir: -1 | 1) => {
    if (subView === 'month') {
      setCursorDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    } else if (subView === 'week') {
      setCursorDate((d) => addDays(d, dir * 7));
    } else if (subView === 'multiday') {
      setCursorDate((d) => addDays(d, dir * 3));
    } else {
      setCursorDate((d) => addDays(d, dir));
    }
  };

  const handleCreateOnDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCellDate || !quickCellTitle.trim()) return;
    addTask({
      title: quickCellTitle.trim(),
      dueDate: quickCellDate,
      startDate: quickCellDate,
      listId: 'inbox',
    });
    setQuickCellTitle('');
    setQuickCellDate(null);
  };

  return (
    <div className="flex-1 flex h-full min-w-0 bg-white">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Calendar Header */}
        <header className="min-h-12 md:h-13 py-2 md:py-0 px-3 sm:px-5 border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <CalendarIcon className="w-4 h-4 text-zinc-700 shrink-0" strokeWidth={1.75} />
              <h1 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono-num truncate">
                {format(cursorDate, subView === 'day' ? 'EEE, MMM d, yyyy' : 'MMMM yyyy')}
              </h1>
            </div>

            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200/70 shrink-0">
              <button
                onClick={() => handleNavigate(-1)}
                aria-label="Previous period"
                className="p-1 rounded-md hover:bg-white text-zinc-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setCursorDate(today)}
                className="px-2 py-0.5 text-xs font-semibold text-zinc-700 hover:bg-white rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => handleNavigate(1)}
                aria-label="Next period"
                className="p-1 rounded-md hover:bg-white text-zinc-600"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* 5 Calendar View Switcher + External Calendar Sync + Unscheduled Drawer Toggle */}
          <div className="flex items-center justify-between w-full md:w-auto gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 shrink-0">
              {(
                [
                  ['month', 'Month'],
                  ['week', 'Week'],
                  ['multiday', '3-Day'],
                  ['day', 'Day'],
                  ['agenda', 'Agenda'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSubView(id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium ${
                    subView === id
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowSubModal(true)}
                title="Sync External Calendars"
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200/80 hover:bg-zinc-50 text-zinc-700 font-mono-num"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                <span className="hidden lg:inline">Sync ({calendarSubscriptions.length})</span>
              </button>

              <button
                onClick={() => setShowUnscheduledDrawer((v) => !v)}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border font-mono-num whitespace-nowrap ${
                  showUnscheduledDrawer
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Arrange ({unscheduledTasks.length})
              </button>
            </div>
          </div>
        </header>

        {/* Calendar Body + Optional Unscheduled Drawer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Calendar Grid */}
          <div className="flex-1 overflow-y-auto">
            {subView === 'month' && (
              <div className="flex flex-col h-full min-h-[600px]">
                <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-2 text-center border-r border-zinc-100">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                  {monthDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, cursorDate);
                    const isTodayCell = isSameDay(day, today);
                    const dayTasks = activeTasks.filter((t) => t.dueDate === dateStr);
                    const dayEvents = externalEvents.filter((ev) => ev.date === dateStr);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setQuickCellDate(dateStr)}
                        className={`min-h-[72px] sm:min-h-[104px] p-1 sm:p-1.5 border-b border-r border-zinc-100 flex flex-col cursor-pointer ${
                          isCurrentMonth ? 'bg-white hover:bg-zinc-50/60' : 'bg-zinc-50/50 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-mono-num w-6 h-6 rounded-md flex items-center justify-center ${
                              isTodayCell
                                ? 'bg-zinc-900 text-white font-semibold'
                                : 'text-zinc-600'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                          <Plus className="w-3 h-3 text-zinc-300 opacity-0 hover:opacity-100" strokeWidth={1.75} />
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-28">
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              style={{ borderLeftColor: ev.color }}
                              className="px-1.5 py-0.5 rounded bg-zinc-100 border-l-2 text-[10px] text-zinc-700 truncate font-medium font-mono-num"
                            >
                              {ev.startTime} {ev.title}
                            </div>
                          ))}

                          {dayTasks.map((task) => {
                            const listColor =
                              lists.find((l) => l.id === task.listId)?.color || '#3b66f5';
                            return (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(task.id);
                                }}
                                style={{ borderLeftColor: listColor }}
                                className={`px-1.5 py-0.5 rounded border-l-2 text-[10px] truncate flex items-center gap-1 ${
                                  selectedTaskId === task.id
                                    ? 'bg-zinc-900 text-white font-semibold'
                                    : task.status === 'completed'
                                      ? 'bg-zinc-100 text-zinc-400'
                                      : 'bg-zinc-50 border border-zinc-200/60 text-zinc-800 hover:bg-zinc-100'
                                }`}
                              >
                                {task.startTime && (
                                  <span className="font-mono-num text-[9px] opacity-75">
                                    {task.startTime}
                                  </span>
                                )}
                                <span className="truncate">{task.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(subView === 'week' || subView === 'multiday' || subView === 'day') && (
              <div
                className={`flex flex-col ${
                  subView === 'day'
                    ? 'w-full min-w-0'
                    : subView === 'multiday'
                      ? 'min-w-[340px] sm:min-w-0 w-full'
                      : 'min-w-[640px]'
                }`}
              >
                {(() => {
                  const cols =
                    subView === 'week'
                      ? weekDays
                      : subView === 'multiday'
                        ? multiDays
                        : [cursorDate];

                  return (
                    <>
                      {/* Column Headers + All-Day Row */}
                      <div
                        style={{
                          gridTemplateColumns: `64px repeat(${cols.length}, minmax(0, 1fr))`,
                        }}
                        className="grid border-b border-zinc-200/80 bg-zinc-50 sticky top-0 z-10"
                      >
                        <div className="p-2 text-[10px] font-semibold text-zinc-400 border-r border-zinc-200/80 flex items-end justify-center">
                          All-Day
                        </div>
                        {cols.map((d) => {
                          const dStr = format(d, 'yyyy-MM-dd');
                          const allDayTasks = activeTasks.filter(
                            (t) => t.dueDate === dStr && (!t.startTime || t.isAllDay)
                          );
                          return (
                            <div key={dStr} className="p-2 border-r border-zinc-200/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-zinc-500">
                                  {format(d, 'EEE')}
                                </span>
                                <span
                                  className={`text-xs font-mono-num px-1.5 py-0.5 rounded-md ${
                                    dStr === todayStr
                                      ? 'bg-zinc-900 text-white font-semibold'
                                      : 'text-zinc-700 font-semibold'
                                  }`}
                                >
                                  {format(d, 'MMM d')}
                                </span>
                              </div>
                              <div className="space-y-1 pt-1">
                                {allDayTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={() => setSelectedTaskId(t.id)}
                                    className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-medium truncate cursor-pointer"
                                  >
                                    {t.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Hourly Time-Blocking Rows */}
                      {hours.map((hr) => {
                        const hrPrefix = String(hr).padStart(2, '0');
                        return (
                          <div
                            key={hr}
                            style={{
                              gridTemplateColumns: `64px repeat(${cols.length}, minmax(0, 1fr))`,
                            }}
                            className="grid border-b border-zinc-100 min-h-[56px]"
                          >
                            <div className="px-2 py-1 text-[10px] font-mono-num text-zinc-400 border-r border-zinc-200/80 text-right">
                              {hrPrefix}:00
                            </div>
                            {cols.map((d) => {
                              const dStr = format(d, 'yyyy-MM-dd');
                              const slotTasks = activeTasks.filter(
                                (t) =>
                                  t.dueDate === dStr &&
                                  t.startTime &&
                                  t.startTime.startsWith(hrPrefix)
                              );
                              const slotEvents = externalEvents.filter(
                                (ev) => ev.date === dStr && ev.startTime.startsWith(hrPrefix)
                              );

                              return (
                                <div
                                  key={`${dStr}-${hr}`}
                                  onClick={() => setQuickCellDate(dStr)}
                                  className="p-1 border-r border-zinc-100 hover:bg-zinc-50/70 space-y-1 cursor-pointer"
                                >
                                  {slotEvents.map((ev) => (
                                    <div
                                      key={ev.id}
                                      className="p-1.5 rounded-md bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-800 font-medium"
                                    >
                                      <div className="font-mono-num text-zinc-500">
                                        {ev.startTime} – {ev.endTime} ({ev.calendarName})
                                      </div>
                                      <div>{ev.title}</div>
                                    </div>
                                  ))}
                                  {slotTasks.map((t) => (
                                    <div
                                      key={t.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTaskId(t.id);
                                      }}
                                      className={`p-1.5 rounded-md border text-[11px] font-medium cursor-pointer ${
                                        t.priority === 5
                                          ? 'bg-rose-50 border-rose-200/80 text-rose-900'
                                          : 'bg-zinc-900 border-zinc-900 text-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px] font-mono-num opacity-75">
                                        <span>
                                          {t.startTime}
                                          {t.endTime ? ` – ${t.endTime}` : ''}
                                        </span>
                                        {t.durationMinutes && <span>{t.durationMinutes}m</span>}
                                      </div>
                                      <div className="truncate font-semibold">{t.title}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}

            {subView === 'agenda' && (
              <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
                {Array.from({ length: 7 }, (_, i) => addDays(cursorDate, i)).map((day) => {
                  const dStr = format(day, 'yyyy-MM-dd');
                  const dayTasks = activeTasks.filter((t) => t.dueDate === dStr);
                  const dayEvents = externalEvents.filter((ev) => ev.date === dStr);

                  return (
                    <div
                      key={dStr}
                      className="surface-card rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-xs font-semibold text-zinc-900">
                          {format(day, 'EEEE, MMMM d')}
                        </span>
                        <span className="text-[11px] font-mono-num text-zinc-400">
                          {dayTasks.length + dayEvents.length} items
                        </span>
                      </div>

                      {dayTasks.length === 0 && dayEvents.length === 0 ? (
                        <p className="text-xs text-zinc-400">No scheduled items</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 text-xs text-zinc-800"
                            >
                              <span className="font-semibold">{ev.title}</span>
                              <span className="font-mono-num text-[11px] text-zinc-500">
                                {ev.startTime} – {ev.endTime}
                              </span>
                            </div>
                          ))}
                          {dayTasks
                            .filter((t) => t.status !== 'completed')
                            .map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTaskId(t.id)}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 text-xs cursor-pointer border border-zinc-200/60"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleTaskStatus(t.id);
                                    }}
                                    className="rounded text-zinc-900"
                                  />
                                  <span className="font-medium text-zinc-800">
                                    {t.title}
                                  </span>
                                </div>
                                <span className="font-mono-num text-[11px] text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" strokeWidth={1.75} />
                                  {t.startTime || 'All-Day'}
                                </span>
                              </div>
                            ))}

                          {dayTasks.some((t) => t.status === 'completed') && (
                            <div className="pt-2 space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 px-1">
                                <ChevronDown className="w-3 h-3" />
                                <span>
                                  Completed{' '}
                                  {dayTasks.filter((t) => t.status === 'completed').length}
                                </span>
                              </div>
                              {dayTasks
                                .filter((t) => t.status === 'completed')
                                .map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={() => setSelectedTaskId(t.id)}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50/60 hover:bg-zinc-100/80 text-xs cursor-pointer border border-zinc-200/40"
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={true}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleTaskStatus(t.id);
                                        }}
                                        className="rounded text-zinc-400"
                                      />
                                      <span className="font-medium text-zinc-400">
                                        {t.title}
                                      </span>
                                    </div>
                                    <span className="font-mono-num text-[11px] text-zinc-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" strokeWidth={1.75} />
                                      {t.startTime || 'All-Day'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unscheduled Tasks Arrangement Drawer (Premium Time-Blocking Helper) */}
          {showUnscheduledDrawer && (
            <>
              <div
                onClick={() => setShowUnscheduledDrawer(false)}
                className="lg:hidden fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-[2px] animate-backdrop"
              />
              <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[68dvh] rounded-t-2xl shadow-2xl lg:shadow-none lg:rounded-none lg:max-h-none lg:static lg:z-auto w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-zinc-200/80 bg-white lg:bg-zinc-50/70 p-4 pb-20 lg:p-3 flex flex-col shrink-0 animate-sheet-up lg:[animation:none]">
                <div className="lg:hidden w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-3 shrink-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                    Arrange Tasks
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-num text-zinc-400">
                      {unscheduledTasks.length} undated
                    </span>
                    <button
                      onClick={() => setShowUnscheduledDrawer(false)}
                      className="lg:hidden p-1 rounded-md text-zinc-400 hover:bg-zinc-100"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Schedule any undated task to time-block it onto your active calendar date.
                </p>
                <div className="space-y-2 overflow-y-auto flex-1">
                  {unscheduledTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-2"
                    >
                      <div className="text-xs font-medium text-zinc-800">{t.title}</div>
                      <button
                        onClick={() =>
                          updateTask(
                            t.id,
                            {
                              dueDate: format(cursorDate, 'yyyy-MM-dd'),
                              startDate: format(cursorDate, 'yyyy-MM-dd'),
                              startTime: '10:00',
                              durationMinutes: 60,
                            },
                            `Time-blocked onto ${format(cursorDate, 'MMM d')} at 10:00`
                          )
                        }
                        className="w-full py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold font-mono-num"
                      >
                        + Schedule on {format(cursorDate, 'MMM d')}
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Right Task Detail Inspector */}
      <TaskDetailPane />

      {/* Quick Create Task on Selected Date Modal */}
      {quickCellDate && (
        <div
          onClick={() => setQuickCellDate(null)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateOnDate}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-3 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">
              Schedule Task on {format(parseISO(quickCellDate), 'EEEE, MMM d')}
            </h3>
            <input
              type="text"
              autoFocus
              required
              value={quickCellTitle}
              onChange={(e) => setQuickCellTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickCellDate(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Add to Calendar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* External Calendar Subscriptions Modal (Premium) */}
      {showSubModal && (
        <div
          onClick={() => setShowSubModal(false)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface-floating rounded-xl w-full max-w-md p-5 space-y-4 animate-modal"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
                External Calendar Subscriptions
              </h3>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-2">
              {calendarSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-800 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      {sub.name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">{sub.url}</div>
                  </div>
                  <button
                    onClick={() => toggleCalendarSubscription(sub.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      sub.enabled
                        ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-700'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {sub.enabled ? 'Synced' : 'Paused'}
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (subName.trim() && subUrl.trim()) {
                  addCalendarSubscription(subName.trim(), subUrl.trim(), subProvider, '#0ea5e9');
                  setSubName('');
                  setSubUrl('');
                }
              }}
              className="space-y-2.5 pt-2 border-t border-zinc-200/80"
            >
              <div className="text-xs font-semibold text-zinc-700">
                Subscribe via ICS / Webcal URL
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Calendar Name (e.g. Outlook)"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300"
                />
                <select
                  value={subProvider}
                  onChange={(e) => setSubProvider(e.target.value as typeof subProvider)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook Calendar</option>
                  <option value="apple">Apple iCloud</option>
                  <option value="ics">Custom ICS Feed</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                placeholder="webcal:// or https://.../basic.ics"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} /> Connect Calendar Feed
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

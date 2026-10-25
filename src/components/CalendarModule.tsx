import React, { useMemo, useRef, useState } from 'react';
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
  Repeat,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskDetailPane } from './TaskDetailPane';
import { isTaskDueOnDate } from '../utils/recurringTasks';
import { Task } from '../types';

type CalendarSubView = 'month' | 'week' | 'day' | 'multiday' | 'agenda';

const MAX_MONTH_VISIBLE = 3;
const MAX_ALLDAY_VISIBLE = 2;

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
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const [expandedDayNewTitle, setExpandedDayNewTitle] = useState('');
  const [selectedCellDate, setSelectedCellDate] = useState<string | null>(null);

  // ---- Arrastar para criar tarefa ----
  const SLOT = 15; // cada faixa do grid vale 15 minutos
  const pad = (n: number) => String(n).padStart(2, '0');
  const toHM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  type DragRange = { date: string; start: number; end: number }; // em minutos desde 00:00
  const [drag, setDrag] = useState<DragRange | null>(null);
  const [quickRange, setQuickRange] = useState<{ start: number; end: number } | null>(null);
  const dragRef = useRef<DragRange | null>(null);

  const closeQuick = () => {
    setQuickCellDate(null);
    setQuickRange(null);
  };

  const startDragCreate = (e: React.PointerEvent, dStr: string, anchor: number) => {
    if (e.button !== 0) return;
    e.preventDefault();

    let moved = false;
    const first: DragRange = { date: dStr, start: anchor, end: anchor + SLOT };
    dragRef.current = first;
    setDrag(first);

    const onMove = (ev: PointerEvent) => {
      const slot = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)
        ?.closest<HTMLElement>('[data-slot-min]');
      // o arrasto fica restrito ao dia onde começou
      if (!slot || slot.dataset.date !== dStr) return;

      const m = Number(slot.dataset.slotMin);
      if (m !== anchor) moved = true;

      const next: DragRange =
        m >= anchor
          ? { date: dStr, start: anchor, end: m + SLOT }
          : { date: dStr, start: m, end: anchor + SLOT };

      dragRef.current = next;
      setDrag(next);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const r = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!r) return;

      // clique sem arrastar: cria um bloco de 1 hora
      const end = moved ? r.end : r.start + 60;
      setQuickRange({ start: r.start, end });
      setQuickCellDate(dStr);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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

  const sortDayTasks = (dayTaskList: Task[]): Task[] => {
    return [...dayTaskList].sort((a, b) => {
      const aDone = a.status === 'completed';
      const bDone = b.status === 'completed';
      if (aDone !== bDone) return aDone ? 1 : -1;

      const aTimed = Boolean(a.startTime && !a.isAllDay);
      const bTimed = Boolean(b.startTime && !b.isAllDay);
      if (aTimed !== bTimed) return aTimed ? -1 : 1;

      if (aTimed && bTimed && a.startTime && b.startTime) {
        const timeCmp = a.startTime.localeCompare(b.startTime);
        if (timeCmp !== 0) return timeCmp;
      }

      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.title.localeCompare(b.title);
    });
  };

  const getTaskAccentColor = (task: Task): string => {
    if (task.status === 'completed') return '#d4d4d8';
    if (task.priority === 5) return '#f43f5e';
    if (task.priority === 3) return '#f59e0b';
    if (task.priority === 1) return '#3b82f6';
    return lists.find((l) => l.id === task.listId)?.color || '#52525b';
  };

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
      ...(quickRange
        ? {
            startTime: toHM(quickRange.start),
            endTime: toHM(quickRange.end),
            durationMinutes: quickRange.end - quickRange.start,
            isAllDay: false,
          }
        : {}),
    });
    setQuickCellTitle('');
    closeQuick();
  };

  const handleCreateInExpandedDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedDayDate || !expandedDayNewTitle.trim()) return;
    addTask({
      title: expandedDayNewTitle.trim(),
      dueDate: expandedDayDate,
      startDate: expandedDayDate,
      listId: 'inbox',
    });
    setExpandedDayNewTitle('');
  };

  const headerDateLabel = useMemo(() => {
    if (subView === 'month') {
      return format(cursorDate, 'MMMM yyyy');
    }
    if (subView === 'week') {
      const start = startOfWeek(cursorDate);
      const end = endOfWeek(cursorDate);
      if (format(start, 'yyyy') !== format(end, 'yyyy')) {
        return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
      }
      if (format(start, 'MMM') !== format(end, 'MMM')) {
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      }
      return `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`;
    }
    if (subView === 'multiday') {
      const end = addDays(cursorDate, 2);
      return `${format(cursorDate, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    if (subView === 'day') {
      return format(cursorDate, 'EEEE, MMMM d, yyyy');
    }
    if (subView === 'agenda') {
      const end = addDays(cursorDate, 6);
      return `${format(cursorDate, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return format(cursorDate, 'MMMM yyyy');
  }, [cursorDate, subView]);

  return (
    <div className="flex-1 flex h-full min-w-0 bg-white">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Calendar Header — Clean Date Range + Chevrons (No redundant Today button) */}
        <header className="min-h-12 md:h-13 py-2 md:py-0 px-3 sm:px-5 border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <CalendarIcon className="w-4 h-4 text-zinc-700 shrink-0" strokeWidth={1.75} />
              <h1 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono-num truncate">
                {headerDateLabel}
              </h1>
            </div>

            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200/70 shrink-0">
              <button
                type="button"
                onClick={() => handleNavigate(-1)}
                aria-label="Previous period"
                className="p-1 rounded-md hover:bg-white text-zinc-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate(1)}
                aria-label="Next period"
                className="p-1 rounded-md hover:bg-white text-zinc-600 transition-colors"
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
              <div className="flex flex-col h-full min-h-[620px]">
                <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-zinc-50/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const dayTasks = sortDayTasks(
                      activeTasks.filter((t) => isTaskDueOnDate(t, dateStr))
                    );
                    const dayEvents = externalEvents.filter((ev) => ev.date === dateStr);

                    // Combine events + tasks with a strict visual cap of MAX_MONTH_VISIBLE (3)
                    type CombinedItem =
                      | { kind: 'event'; id: string; title: string; time?: string; color: string }
                      | { kind: 'task'; task: Task };

                    const combinedItems: CombinedItem[] = [
                      ...dayEvents.map((ev) => ({
                        kind: 'event' as const,
                        id: ev.id,
                        title: ev.title,
                        time: ev.startTime,
                        color: ev.color,
                      })),
                      ...dayTasks.map((task) => ({
                        kind: 'task' as const,
                        task,
                      })),
                    ];

                    const visibleItems = combinedItems.slice(0, MAX_MONTH_VISIBLE);
                    const hiddenItems = combinedItems.slice(MAX_MONTH_VISIBLE);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setQuickCellDate(dateStr)}
                        className={`group min-h-[78px] sm:min-h-[112px] p-1.5 border-b border-r border-zinc-200/60 flex flex-col cursor-pointer transition-colors ${
                          !isCurrentMonth
                            ? 'bg-zinc-50/60 text-zinc-400'
                            : isWeekend
                              ? 'bg-zinc-50/25 hover:bg-zinc-50/70'
                              : 'bg-white hover:bg-zinc-50/50'
                        }`}
                      >
                        {/* Cell Top Row: Date Number + Quiet Task Count / Quick Add */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-xs font-mono-num w-6 h-6 rounded-md flex items-center justify-center ${
                              isTodayCell
                                ? 'bg-zinc-900 text-white font-semibold'
                                : isCurrentMonth
                                  ? 'text-zinc-700 font-medium'
                                  : 'text-zinc-400'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>

                          <div className="flex items-center gap-1">
                            {combinedItems.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDayDate(dateStr);
                                }}
                                title={`View all ${combinedItems.length} items on ${format(day, 'MMM d')}`}
                                className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-num text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                              >
                                {combinedItems.length}
                              </button>
                            )}
                            <Plus
                              className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              strokeWidth={1.75}
                            />
                          </div>
                        </div>

                        {/* Mobile Clean Dots (<640px) */}
                        <div className="sm:hidden flex items-center justify-center gap-1 mt-1">
                          {combinedItems.slice(0, 4).map((item, idx) => {
                            const dotColor =
                              item.kind === 'event'
                                ? item.color
                                : getTaskAccentColor(item.task);
                            return (
                              <span
                                key={idx}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: dotColor }}
                              />
                            );
                          })}
                          {combinedItems.length > 4 && (
                            <span className="text-[9px] font-mono-num text-zinc-400">
                              +{combinedItems.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Tablet/Desktop Flat Typographic Bars — Capped at 3, Zero Scrollbars */}
                        <div className="hidden sm:flex flex-col gap-1 flex-1">
                          {visibleItems.map((item) => {
                            if (item.kind === 'event') {
                              return (
                                <div
                                  key={item.id}
                                  style={{ borderLeftColor: item.color }}
                                  className="h-[21px] px-1.5 rounded-[4px] bg-sky-50/70 border-l-[2.5px] text-[11px] text-zinc-700 truncate flex items-center gap-1.5 font-medium"
                                >
                                  {item.time && (
                                    <span className="font-mono-num text-[10px] text-zinc-400 shrink-0">
                                      {item.time}
                                    </span>
                                  )}
                                  <span className="truncate">{item.title}</span>
                                </div>
                              );
                            }

                            const { task } = item;
                            const isSelectedHere =
                              selectedTaskId === task.id && selectedCellDate === dateStr;
                            const isDone = task.status === 'completed';
                            const accentColor = getTaskAccentColor(task);

                            return (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCellDate(dateStr);
                                  setSelectedTaskId(task.id);
                                }}
                                style={{ borderLeftColor: accentColor }}
                                className={`h-[21px] px-1.5 rounded-[4px] border-l-[2.5px] text-[11px] leading-none flex items-center gap-1.5 transition-colors ${
                                  isSelectedHere
                                    ? 'bg-blue-50/95 text-blue-950 ring-1 ring-blue-500/30 font-semibold'
                                    : isDone
                                      ? 'bg-zinc-50 text-zinc-400'
                                      : 'bg-zinc-100/75 hover:bg-zinc-200/65 text-zinc-800 font-medium'
                                }`}
                              >
                                {task.startTime && (
                                  <span
                                    className={`font-mono-num text-[10px] shrink-0 ${
                                      isDone ? 'text-zinc-300' : 'text-zinc-500'
                                    }`}
                                  >
                                    {task.startTime}
                                  </span>
                                )}
                                <span className="truncate flex-1">{task.title}</span>
                                {task.recurrenceRule && (
                                  <Repeat className="w-2.5 h-2.5 shrink-0 text-zinc-400" />
                                )}
                              </div>
                            );
                          })}

                          {/* Overflow Summary Pill (+N more) */}
                          {hiddenItems.length > 0 && (
                            <button
                              type="button"
                              data-testid={`calendar-more-${dateStr}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDayDate(dateStr);
                              }}
                              className="h-[20px] px-1.5 rounded-[4px] bg-zinc-100/60 hover:bg-zinc-200/80 text-[10px] font-mono-num font-semibold text-zinc-500 hover:text-zinc-900 flex items-center justify-between transition-colors mt-auto"
                            >
                              <span>+{hiddenItems.length} more</span>
                              <span className="flex items-center gap-0.5">
                                {hiddenItems.slice(0, 4).map((hi, idx) => {
                                  const c =
                                    hi.kind === 'event'
                                      ? hi.color
                                      : getTaskAccentColor(hi.task);
                                  return (
                                    <span
                                      key={idx}
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: c }}
                                    />
                                  );
                                })}
                              </span>
                            </button>
                          )}
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

                  const allDayCap = subView === 'day' ? 5 : MAX_ALLDAY_VISIBLE;

                  return (
                    <>
                      {/* Column Headers + Compact All-Day Row */}
                      <div
                        style={{
                          gridTemplateColumns: `64px repeat(${cols.length}, minmax(0, 1fr))`,
                        }}
                        className="grid border-b border-zinc-200/80 bg-zinc-50/95 backdrop-blur-xs sticky top-0 z-10"
                      >
                        <div className="p-2 text-[10px] font-semibold text-zinc-400 border-r border-zinc-200/80 flex items-end justify-center">
                          All-Day
                        </div>
                        {cols.map((d) => {
                          const dStr = format(d, 'yyyy-MM-dd');
                          const dayAllTasks = sortDayTasks(
                            activeTasks.filter((t) => isTaskDueOnDate(t, dStr))
                          );
                          const allDayTasks = dayAllTasks.filter(
                            (t) => !t.startTime || t.isAllDay
                          );
                          const visibleAllDay = allDayTasks.slice(0, allDayCap);
                          const hiddenAllDayCount = Math.max(
                            0,
                            allDayTasks.length - visibleAllDay.length
                          );

                          return (
                            <div
                              key={dStr}
                              className="p-2 border-r border-zinc-200/80 flex flex-col gap-1 min-w-0"
                            >
                              <div className="flex items-center justify-between gap-1">

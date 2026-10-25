import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskDetailPane } from './TaskDetailPane';
import { isTaskDueOnDate } from '../utils/recurringTasks';
import { Task } from '../types';

type CalendarSubView = 'month' | 'week' | 'day' | 'multiday' | 'agenda';

const MAX_MONTH_VISIBLE = 3;
const MAX_ALLDAY_VISIBLE = 2;
const BASE_ROW_HEIGHT = 54;
const SNAP_MINUTES = 15;
const MIN_DURATION = 15;
const RANGE_KEY = 'ticktick_calendar_range';
const DEFAULT_LIST_ID = 'inbox';
const PROVIDER_COLORS: Record<'google' | 'outlook' | 'apple' | 'ics', string> = {
  google: '#4285f4',
  outlook: '#0078d4',
  apple: '#8e8e93',
  ics: '#0ea5e9',
};

const pad = (n: number) => String(n).padStart(2, '0');
const minutesToTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const clampZoom = (v: number) => Math.min(2.5, Math.max(0.5, Math.round(v * 10) / 10));
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// Aceita webcal:// e http(s); devolve uma URL válida ou null
const normalizeIcsUrl = (raw: string): string | null => {
  let url = raw.trim();
  if (!url) return null;
  if (/^webcal:\/\//i.test(url)) url = `https://${url.slice('webcal://'.length)}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.href;
  } catch {
    return null;
  }
};

interface DayRange {
  startHour: number;
  endHour: number;
}

interface ResizeState {
  taskId: string;
  startY: number;
  startDur: number;
  dur: number;
  rowH: number;
  startMin: number;
  maxDur: number;
}

function loadDayRange(): DayRange {
  try {
    const raw = localStorage.getItem(RANGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DayRange;
      if (
        typeof parsed.startHour === 'number' &&
        typeof parsed.endHour === 'number' &&
        parsed.endHour > parsed.startHour
      ) {
        return parsed;
      }
    }
  } catch {
    // ignora erro de leitura
  }
  return { startHour: 0, endHour: 24 };
}

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
  const [subError, setSubError] = useState('');
  const [quickCellDate, setQuickCellDate] = useState<string | null>(null);
  const [quickCellTitle, setQuickCellTitle] = useState('');
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const [expandedDayNewTitle, setExpandedDayNewTitle] = useState('');
  const [selectedCellDate, setSelectedCellDate] = useState<string | null>(null);

  const [dayRange, setDayRange] = useState<DayRange>(() => loadDayRange());
  const [zoom, setZoom] = useState<number>(1);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [resizePreview, setResizePreview] = useState<{ taskId: string; dur: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const createRef = useRef<{ dateStr: string; startMin: number; endMin: number } | null>(null);
  const suppressClickRef = useRef(false);
  // Função que remove os listeners globais do gesto de mouse em andamento
  const gestureCleanupRef = useRef<(() => void) | null>(null);
  // Offset (em minutos) entre o ponto pego no bloco e o início da tarefa
  const dragGrabMinRef = useRef(0);
  const [createPreview, setCreatePreview] = useState<{ dateStr: string; startMin: number; endMin: number } | null>(null);
  const [createModal, setCreateModal] = useState<{ dateStr: string; startMin: number; endMin: number } | null>(null);
  const [createTitle, setCreateTitle] = useState('');

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

  useEffect(() => {
    try {
      localStorage.setItem(RANGE_KEY, JSON.stringify(dayRange));
    } catch {
      // ignora
    }
  }, [dayRange]);

  // Zoom só do calendário: Ctrl + roda do mouse dentro da grade
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Remove listeners globais de arraste/redimensionamento se o componente sair da tela no meio de um gesto
  useEffect(() => {
    return () => {
      gestureCleanupRef.current?.();
      gestureCleanupRef.current = null;
      resizeRef.current = null;
      createRef.current = null;
    };
  }, []);

  // Esc cancela o gesto em andamento ou fecha o modal aberto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (gestureCleanupRef.current) {
        gestureCleanupRef.current();
        resizeRef.current = null;
        createRef.current = null;
        setResizePreview(null);
        setCreatePreview(null);
        return;
      }
      if (createModal) setCreateModal(null);
      else if (quickCellDate) setQuickCellDate(null);
      else if (showSubModal) setShowSubModal(false);
      else if (expandedDayDate) setExpandedDayDate(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createModal, quickCellDate, showSubModal, expandedDayDate]);

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

  const hours = useMemo(
    () =>
      Array.from(
        { length: dayRange.endHour - dayRange.startHour },
        (_, i) => dayRange.startHour + i
      ),
    [dayRange]
  );

  const rowHeight = Math.round(BASE_ROW_HEIGHT * zoom);
  const totalHeight = hours.length * rowHeight;

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

  // ---------- Arrastar e soltar ----------

  const dragProps = (taskId: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // Só blocos da grade têm offset; cartões da gaveta e chips do mês/dia inteiro começam no topo
      dragGrabMinRef.current =
        e.currentTarget.dataset.block === 'task'
          ? Math.floor(((e.clientY - rect.top) / rowHeight) * (60 / SNAP_MINUTES)) * SNAP_MINUTES
          : 0;
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingTaskId(taskId);
    },
    onDragEnd: () => {
      setDraggingTaskId(null);
      setDropKey(null);
    },
  });

  const scheduleTaskAllDay = (taskId: string, dateStr: string) => {
    updateTask(
      taskId,
      {
        dueDate: dateStr,
        startDate: dateStr,
        isAllDay: true,
        startTime: undefined,
        endTime: undefined,
      },
      `Movido para ${format(parseISO(dateStr), 'dd/MM/yyyy')} (dia inteiro)`
    );
  };

  const scheduleTaskAt = (taskId: string, dateStr: string, timeStr: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const duration = task.durationMinutes || 60;
    const [h, m] = timeStr.split(':').map(Number);
    const endTime = minutesToTime(Math.min(h * 60 + m + duration, 23 * 60 + 59));
    updateTask(
      taskId,
      {
        dueDate: dateStr,
        startDate: dateStr,
        isAllDay: false,
        startTime: timeStr,
        endTime,
        durationMinutes: duration,
      },
      `Movido para ${format(parseISO(dateStr), 'dd/MM/yyyy')} às ${timeStr}`
    );
  };

  const handleSlotDragOver = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropKey !== key) setDropKey(key);
  };

  const handleAllDayDrop = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDropKey(null);
    if (taskId) scheduleTaskAllDay(taskId, dateStr);
  };

  const handleMonthDrop = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task?.startTime && !task.isAllDay) {
      scheduleTaskAt(taskId, dateStr, task.startTime);
    } else {
      scheduleTaskAllDay(taskId, dateStr);
    }
  };

  // Registra listeners globais do mouse e guarda como removê-los (usado no Esc e no unmount)
  const trackMouse = (onMove: (ev: MouseEvent) => void, onUp: () => void) => {
    gestureCleanupRef.current?.();
    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', up);
      gestureCleanupRef.current = null;
    };
    const up = () => {
      cleanup();
      onUp();
    };
    gestureCleanupRef.current = cleanup;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', up);
  };

  // ---------- Alterar duração (bolinha na borda inferior) ----------

  const startResize = (
    e: React.MouseEvent<HTMLDivElement>,
    task: Task,
    startMin: number,
    rowH: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startDur = task.durationMinutes || 60;
    const maxDur = Math.max(MIN_DURATION, dayRange.endHour * 60 - startMin);

    resizeRef.current = {
      taskId: task.id,
      startY: e.clientY,
      startDur,
      dur: startDur,
      rowH,
      startMin,
      maxDur,
    };
    setResizePreview({ taskId: task.id, dur: startDur });

    const onMove = (ev: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const deltaMin = ((ev.clientY - r.startY) / r.rowH) * 60;
      let dur = Math.round((r.startDur + deltaMin) / SNAP_MINUTES) * SNAP_MINUTES;
      dur = Math.max(MIN_DURATION, Math.min(dur, r.maxDur));
      r.dur = dur;
      setResizePreview({ taskId: r.taskId, dur });
    };

    const onUp = () => {
      const r = resizeRef.current;
      resizeRef.current = null;
      setResizePreview(null);
      if (r && r.dur !== r.startDur) {
        updateTask(
          r.taskId,
          {
            durationMinutes: r.dur,
            endTime: minutesToTime(r.startMin + r.dur),
          },
          `Duração alterada para ${r.dur} min`
        );
      }
    };

    trackMouse(onMove, onUp);
  };

  // ---------- Criar tarefa clicando e arrastando na grade ----------

  const minuteAtY = (y: number, mode: 'floor' | 'ceil') => {
    const steps = (y / rowHeight) * (60 / SNAP_MINUTES);
    const idx = mode === 'floor' ? Math.floor(steps) : Math.ceil(steps);
    const m = dayRange.startHour * 60 + idx * SNAP_MINUTES;
    return Math.min(Math.max(m, dayRange.startHour * 60), dayRange.endHour * 60 - SNAP_MINUTES);
  };

  const layoutColumn = (dStr: string) => {
    const rangeStart = dayRange.startHour * 60;
    const rangeEnd = dayRange.endHour * 60;
    const items = activeTasks
      .filter((t) => t.startTime && !t.isAllDay && isTaskDueOnDate(t, dStr))
      .map((task) => ({
        task,
        start: toMin(task.startTime!),
        dur: Math.max(MIN_DURATION, task.durationMinutes || 60),
      }))
      .filter((x) => x.start >= rangeStart && x.start < rangeEnd)
      .sort((a, b) => a.start - b.start);

    const laneEnds: number[] = [];
    const placed = items.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.start + item.dur);
      } else {
        laneEnds[lane] = item.start + item.dur;
      }
      return { ...item, lane };
    });
    return { placed, laneCount: Math.max(1, laneEnds.length) };
  };

  const startColumnDrag = (e: React.MouseEvent<HTMLDivElement>, dateStr: string) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const rangeEnd = dayRange.endHour * 60;
    const startMin = minuteAtY(e.clientY - rect.top, 'floor');
    const initial = { dateStr, startMin, endMin: startMin + SNAP_MINUTES };
    createRef.current = initial;
    setCreatePreview(initial);

    let moved = false;
    const onMove = (ev: MouseEvent) => {
      const cur = createRef.current;
      if (!cur) return;
      let endMin = minuteAtY(ev.clientY - rect.top, 'ceil');
      endMin = Math.min(endMin, rangeEnd);
      endMin = Math.max(endMin, cur.startMin + SNAP_MINUTES);
      if (endMin !== cur.endMin) {
        moved = true;
        const next = { ...cur, endMin };
        createRef.current = next;
        setCreatePreview(next);
      }
    };
    const onUp = () => {
      const cur = createRef.current;
      createRef.current = null;
      setCreatePreview(null);
      if (moved && cur && cur.endMin > cur.startMin) {
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        setCreateModal(cur);
        setCreateTitle('');
      }
    };
    trackMouse(onMove, onUp);
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDropKey(null);
    setDraggingTaskId(null);
    if (!taskId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = minuteAtY(e.clientY - rect.top, 'floor') - dragGrabMinRef.current;
    const m = Math.min(
      Math.max(Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES, dayRange.startHour * 60),
      dayRange.endHour * 60 - SNAP_MINUTES
    );
    scheduleTaskAt(taskId, dateStr, minutesToTime(m));
  };

  const handleCreateFromDrag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModal || !createTitle.trim()) return;
    addTask({
      title: createTitle.trim(),
      dueDate: createModal.dateStr,
      startDate: createModal.dateStr,
      startTime: minutesToTime(createModal.startMin),
      endTime: minutesToTime(createModal.endMin),
      durationMinutes: createModal.endMin - createModal.startMin,
      isAllDay: false,
      listId: DEFAULT_LIST_ID,
    });
    setCreateModal(null);
    setCreateTitle('');
  };

  // ---------- Criação rápida ----------

  const handleCreateOnDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCellDate || !quickCellTitle.trim()) return;
    addTask({
      title: quickCellTitle.trim(),
      dueDate: quickCellDate,
      startDate: quickCellDate,
      listId: DEFAULT_LIST_ID,
    });
    setQuickCellTitle('');
    setQuickCellDate(null);
  };

  const handleCreateInExpandedDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedDayDate || !expandedDayNewTitle.trim()) return;
    addTask({
      title: expandedDayNewTitle.trim(),
      dueDate: expandedDayDate,
      startDate: expandedDayDate,
      listId: DEFAULT_LIST_ID,
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

  const showTimeToolbar = subView === 'week' || subView === 'multiday' || subView === 'day';

  return (
    <div className="flex-1 flex h-full min-w-0 bg-white">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Cabeçalho do calendário */}
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
                aria-label="Período anterior"
                className="p-1 rounded-md hover:bg-white text-zinc-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate(1)}
                aria-label="Próximo período"
                className="p-1 rounded-md hover:bg-white text-zinc-600 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 shrink-0">
              {(
                [
                  ['month', 'Mês'],
                  ['week', 'Semana'],
                  ['multiday', '3 dias'],
                  ['day', 'Dia'],
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
                title="Sincronizar calendários externos"
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200/80 hover:bg-zinc-50 text-zinc-700 font-mono-num"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                <span className="hidden lg:inline">Sincronizar ({calendarSubscriptions.length})</span>
              </button>

              <button
                onClick={() => setShowUnscheduledDrawer((v) => !v)}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border font-mono-num whitespace-nowrap ${
                  showUnscheduledDrawer
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Organizar ({unscheduledTasks.length})
              </button>
            </div>
          </div>
        </header>

        {/* Barra de horário visível e zoom (só nas visões de horas) */}
        {showTimeToolbar && (
          <div className="px-3 sm:px-5 py-2 border-b border-zinc-200/80 bg-zinc-50/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-zinc-600">
              <Clock className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
              <span>Horário visível:</span>
              <select
                value={dayRange.startHour}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDayRange((prev) => ({
                    startHour: v,
                    endHour: Math.max(v + 1, prev.endHour),
                  }));
                }}
                className="px-1.5 py-0.5 rounded-md border border-zinc-300 bg-white font-mono-num"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {pad(h)}:00
                  </option>
                ))}
              </select>
              <span>até</span>
              <select
                value={dayRange.endHour}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDayRange((prev) => ({
                    startHour: prev.startHour,
                    endHour: Math.max(v, prev.startHour + 1),
                  }));
                }}
                className="px-1.5 py-0.5 rounded-md border border-zinc-300 bg-white font-mono-num"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {pad(h)}:00
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
              <span className="hidden md:inline text-zinc-400 mr-1">
                Ctrl + roda do mouse para zoom
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z - 0.1))}
                title="Diminuir zoom do calendário"
                className="p-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100"
              >
                <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Voltar ao tamanho normal"
                className="px-2 py-0.5 rounded-md border border-zinc-300 bg-white font-mono-num min-w-[52px]"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z + 0.1))}
                title="Aumentar zoom do calendário"
                className="p-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100"
              >
                <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* Corpo do calendário + gaveta de tarefas não agendadas */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div ref={gridRef} className="flex-1 overflow-y-auto">
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
                        role="button"
                        tabIndex={0}
                        aria-label={`Criar tarefa em ${format(day, 'dd/MM/yyyy')}`}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setQuickCellDate(dateStr);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => handleMonthDrop(e, dateStr)}
                        className={`group min-h-[78px] sm:min-h-[112px] p-1.5 border-b border-r border-zinc-200/60 flex flex-col cursor-pointer transition-colors ${
                          !isCurrentMonth
                            ? 'bg-zinc-50/60 text-zinc-400'
                            : isWeekend
                              ? 'bg-zinc-50/25 hover:bg-zinc-50/70'
                              : 'bg-white hover:bg-zinc-50/50'
                        }`}
                      >
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
                                title={`Ver os ${combinedItems.length} itens de ${format(day, 'dd/MM')}`}
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

                        {/* Celular: bolinhas */}
                        <div className="sm:hidden flex items-center justify-center gap-1 mt-1">
                          {combinedItems.slice(0, 4).map((item, idx) => {
                            const dotColor =
                              item.kind === 'event' ? item.color : getTaskAccentColor(item.task);
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

                        {/* Tablet/PC: barras */}
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
                                {...dragProps(task.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCellDate(dateStr);
                                  setSelectedTaskId(task.id);
                                }}
                                style={{ borderLeftColor: accentColor }}
                                className={`h-[21px] px-1.5 rounded-[4px] border-l-[2.5px] text-[11px] leading-none flex items-center gap-1.5 transition-colors cursor-grab active:cursor-grabbing ${
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
                              <span>+{hiddenItems.length} mais</span>
                              <span className="flex items-center gap-0.5">
                                {hiddenItems.slice(0, 4).map((hi, idx) => {
                                  const c =
                                    hi.kind === 'event' ? hi.color : getTaskAccentColor(hi.task);
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
                    subView === 'week' ? weekDays : subView === 'multiday' ? multiDays : [cursorDate];

                  const allDayCap = subView === 'day' ? 5 : MAX_ALLDAY_VISIBLE;

                  return (
                    <>
                      {/* Cabeçalho com dias + linha "Dia inteiro" */}
                      <div
                        style={{
                          gridTemplateColumns: `64px repeat(${cols.length}, minmax(0, 1fr))`,
                        }}
                        className="grid border-b border-zinc-200/80 bg-zinc-50/95 backdrop-blur-xs sticky top-0 z-10"
                      >
                        <div className="p-2 text-[10px] font-semibold text-zinc-400 border-r border-zinc-200/80 flex items-end justify-center">
                          Dia inteiro
                        </div>
                        {cols.map((d) => {
                          const dStr = format(d, 'yyyy-MM-dd');
                          const dayAllTasks = sortDayTasks(
                            activeTasks.filter((t) => isTaskDueOnDate(t, dStr))
                          );
                          const allDayTasks = dayAllTasks.filter((t) => !t.startTime || t.isAllDay);
                          const visibleAllDay = allDayTasks.slice(0, allDayCap);
                          const hiddenAllDayCount = Math.max(0, allDayTasks.length - visibleAllDay.length);
                          const allDayKey = `allday-${dStr}`;

                          return (
                            <div
                              key={dStr}
                              onDragOver={(e) => handleSlotDragOver(e, allDayKey)}
                              onDrop={(e) => handleAllDayDrop(e, dStr)}
                              className={`p-2 border-r border-zinc-200/80 flex flex-col gap-1 min-w-0 transition-colors ${
                                dropKey === allDayKey ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[11px] font-medium text-zinc-500">
                                    {format(d, 'EEE')}
                                  </span>
                                  <span
                                    className={`text-xs font-mono-num px-1.5 py-0.5 rounded-md ${
                                      dStr === todayStr
                                        ? 'bg-zinc-900 text-white font-semibold'
                                        : 'text-zinc-800 font-semibold'
                                    }`}
                                  >
                                    {format(d, 'd')}
                                  </span>
                                </div>
                                {dayAllTasks.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDayDate(dStr)}
                                    title={`Ver as ${dayAllTasks.length} tarefas de ${format(d, 'dd/MM')}`}
                                    className="text-[10px] font-mono-num text-zinc-400 hover:text-zinc-800 px-1 py-0.5 rounded hover:bg-zinc-200/60 transition-colors"
                                  >
                                    {dayAllTasks.length}d
                                  </button>
                                )}
                              </div>

                              {visibleAllDay.length > 0 && (
                                <div className="space-y-1 pt-0.5">
                                  {visibleAllDay.map((t) => {
                                    const accentColor = getTaskAccentColor(t);
                                    const isSelectedHere =
                                      selectedTaskId === t.id && selectedCellDate === dStr;
                                    return (
                                      <div
                                        key={t.id}
                                        {...dragProps(t.id)}
                                        onClick={() => {
                                          setSelectedCellDate(dStr);
                                          setSelectedTaskId(t.id);
                                        }}
                                        style={{ borderLeftColor: accentColor }}
                                        className={`h-[21px] px-1.5 rounded-[4px] border border-zinc-200/70 border-l-[2.5px] text-[10px] font-medium truncate cursor-grab active:cursor-grabbing flex items-center justify-between gap-1 transition-colors ${
                                          isSelectedHere
                                            ? 'bg-blue-50 text-blue-950 ring-1 ring-blue-500/30 font-semibold'
                                            : t.status === 'completed'
                                              ? 'bg-zinc-100/70 text-zinc-400'
                                              : 'bg-white hover:bg-zinc-100/80 text-zinc-800'
                                        }`}
                                      >
                                        <span className="truncate">{t.title}</span>
                                        {t.recurrenceRule && (
                                          <Repeat className="w-2.5 h-2.5 shrink-0 text-zinc-400" />
                                        )}
                                      </div>
                                    );
                                  })}

                                  {hiddenAllDayCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedDayDate(dStr)}
                                      className="w-full h-[19px] px-1.5 rounded-[4px] bg-zinc-200/60 hover:bg-zinc-200 text-[10px] font-mono-num font-semibold text-zinc-600 hover:text-zinc-900 text-left transition-colors"
                                    >
                                      +{hiddenAllDayCount} dia inteiro
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Corpo: cada dia é uma coluna com escala fixa (15 min = rowHeight / 4) */}
                      <div
                        style={{ gridTemplateColumns: `64px repeat(${cols.length}, minmax(0, 1fr))` }}
                        className="grid"
                      >
                        <div className="relative border-r border-zinc-200/80" style={{ height: totalHeight }}>
                          {hours.map((hr, i) => (
                            <div
                              key={hr}
                              style={{ top: i * rowHeight + 2 }}
                              className="absolute right-2 text-[10px] font-mono-num text-zinc-400"
                            >
                              {pad(hr)}:00
                            </div>
                          ))}
                        </div>

                        {cols.map((d) => {
                          const dStr = format(d, 'yyyy-MM-dd');
                          const rangeStart = dayRange.startHour * 60;
                          const rangeEnd = dayRange.endHour * 60;
                          const { placed, laneCount } = layoutColumn(dStr);
                          const dayEvents = externalEvents.filter((ev) => ev.date === dStr);
                          const yOf = (m: number) => ((m - rangeStart) / 60) * rowHeight;
                          const hOf = (dur: number) => (dur / 60) * rowHeight;

                          return (
                            <div
                              key={dStr}
                              className={`relative border-r border-zinc-100 min-w-0 cursor-pointer transition-colors ${
                                dropKey === `col-${dStr}` ? 'bg-blue-50/50' : ''
                              }`}
                              style={{ height: totalHeight }}
                              onMouseDown={(e) => startColumnDrag(e, dStr)}
                              onClick={(e) => {
                                if (e.target !== e.currentTarget || suppressClickRef.current) return;
                                setQuickCellDate(dStr);
                              }}
                              onDragOver={(e) => handleSlotDragOver(e, `col-${dStr}`)}
                              onDrop={(e) => handleColumnDrop(e, dStr)}
                            >
                              {hours.map((hr, i) => (
                                <div
                                  key={hr}
                                  style={{ top: i * rowHeight, height: rowHeight }}
                                  className="absolute left-0 right-0 border-t border-zinc-100 pointer-events-none"
                                />
                              ))}

                              {dayEvents.map((ev) => {
                                const evStart = toMin(ev.startTime);
                                const evEnd = toMin(ev.endTime);
                                if (evStart < rangeStart || evStart >= rangeEnd) return null;
                                return (
                                  <div
                                    key={ev.id}
                                    data-block="event"
                                    style={{
                                      top: yOf(evStart),
                                      height: Math.max(hOf(evEnd - evStart) - 2, 2),
                                      borderLeftColor: ev.color,
                                    }}
                                    className="absolute left-1 right-1 z-0 overflow-hidden rounded-[4px] bg-sky-50/80 border border-sky-200/60 border-l-[3px] px-1.5 py-0.5 text-[10px] text-zinc-800 font-medium leading-tight"
                                  >
                                    <div className="font-mono-num text-zinc-500 truncate">
                                      {ev.startTime} – {ev.endTime}
                                    </div>
                                    <div className="truncate">{ev.title}</div>
                                  </div>
                                );
                              })}

                              {placed.map(({ task, start, dur, lane }) => {
                                const isResizing = resizePreview?.taskId === task.id;
                                const shown = isResizing && resizePreview ? resizePreview.dur : dur;
                                const accentColor = getTaskAccentColor(task);
                                const isSelectedHere = selectedTaskId === task.id;
                                const isDone = task.status === 'completed';
                                const canResize = isSelectedHere && !isDone;

                                return (
                                  <div
                                    key={task.id}
                                    data-block="task"
                                    {...dragProps(task.id)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCellDate(dStr);
                                      setSelectedTaskId(task.id);
                                    }}
                                    style={{
                                      top: yOf(start),
                                      height: Math.max(hOf(shown) - 2, 2),
                                      left: `calc(${(lane * 100) / laneCount}% + 4px)`,
                                      width: `calc(${100 / laneCount}% - 8px)`,
                                      borderLeftColor: accentColor,
                                    }}
                                    className={`absolute z-10 overflow-hidden rounded-[4px] border border-l-[3px] px-1.5 py-0.5 text-[11px] leading-tight cursor-grab active:cursor-grabbing transition-colors ${
                                      isSelectedHere
                                        ? 'bg-blue-50 border-blue-300 text-blue-950 ring-1 ring-blue-500/30'
                                        : isDone
                                          ? 'bg-zinc-50 border-zinc-200/80 text-zinc-400'
                                          : task.priority === 5
                                            ? 'bg-rose-50/90 border-rose-200/70 text-rose-950'
                                            : task.priority === 3
                                              ? 'bg-amber-50/90 border-amber-200/70 text-amber-950'
                                              : 'bg-zinc-50/95 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800'
                                    }`}
                                  >
                                    <div className="font-mono-num text-[10px] text-zinc-500 truncate">
                                      {task.startTime} – {minutesToTime(start + shown)} · {shown}m
                                    </div>
                                    <div className="truncate font-semibold">{task.title}</div>

                                    {canResize && (
                                      <div
                                        role="slider"
                                        aria-label="Alterar duração da tarefa"
                                        title="Arraste para aumentar ou diminuir a duração"
                                        data-block="handle"
                                        onMouseDown={(e) => startResize(e, task, start, rowHeight)}
                                        onClick={(e) => e.stopPropagation()}
                                        onDragStart={(e) => e.preventDefault()}
                                        className="absolute left-0 right-0 bottom-0 h-4 cursor-ns-resize flex items-end justify-center bg-blue-500/20 hover:bg-blue-500/40 transition-colors"
                                      >
                                        <span className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md mb-0.5" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {createPreview && createPreview.dateStr === dStr && (
                                <div
                                  style={{
                                    top: yOf(createPreview.startMin),
                                    height: Math.max(hOf(createPreview.endMin - createPreview.startMin) - 2, 2),
                                  }}
                                  className="absolute left-1 right-1 z-20 pointer-events-none overflow-hidden rounded-[4px] bg-blue-100/80 border border-blue-400 px-1.5 text-[10px] font-mono-num text-blue-900 leading-tight"
                                >
                                  {minutesToTime(createPreview.startMin)} – {minutesToTime(createPreview.endMin)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {subView === 'agenda' && (
              <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
                {Array.from({ length: 7 }, (_, i) => addDays(cursorDate, i)).map((day) => {
                  const dStr = format(day, 'yyyy-MM-dd');
                  const dayTasks = sortDayTasks(activeTasks.filter((t) => isTaskDueOnDate(t, dStr)));
                  const dayEvents = externalEvents.filter((ev) => ev.date === dStr);

                  return (
                    <div key={dStr} className="surface-card rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-xs font-semibold text-zinc-900">
                          {format(day, 'EEEE, MMMM d')}
                        </span>
                        <span className="text-[11px] font-mono-num text-zinc-400">
                          {dayTasks.length + dayEvents.length} itens
                        </span>
                      </div>

                      {dayTasks.length === 0 && dayEvents.length === 0 ? (
                        <p className="text-xs text-zinc-400">Nada agendado</p>
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
                                onClick={() => {
                                  setSelectedCellDate(dStr);
                                  setSelectedTaskId(t.id);
                                }}
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
                                  <span className="font-medium text-zinc-800">{t.title}</span>
                                </div>
                                <span className="font-mono-num text-[11px] text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" strokeWidth={1.75} />
                                  {t.startTime || 'Dia inteiro'}
                                </span>
                              </div>
                            ))}

                          {dayTasks.some((t) => t.status === 'completed') && (
                            <div className="pt-2 space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 px-1">
                                <ChevronDown className="w-3 h-3" />
                                <span>
                                  Concluídas {dayTasks.filter((t) => t.status === 'completed').length}
                                </span>
                              </div>
                              {dayTasks
                                .filter((t) => t.status === 'completed')
                                .map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={() => {
                                      setSelectedCellDate(dStr);
                                      setSelectedTaskId(t.id);
                                    }}
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
                                      <span className="font-medium text-zinc-400">{t.title}</span>
                                    </div>
                                    <span className="font-mono-num text-[11px] text-zinc-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" strokeWidth={1.75} />
                                      {t.startTime || 'Dia inteiro'}
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

          {/* Gaveta "Organizar tarefas" */}
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
                    Organizar tarefas
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-num text-zinc-400">
                      {unscheduledTasks.length} sem data
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
                  Arraste a tarefa para a grade ou clique em agendar no dia atual.
                </p>
                <div className="space-y-2 overflow-y-auto flex-1">
                  {unscheduledTasks.map((t) => (
                    <div
                      key={t.id}
                      {...dragProps(t.id)}
                      className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-2 cursor-grab active:cursor-grabbing"
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
                            `Agendada para ${format(cursorDate, 'dd/MM')} às 10:00`
                          )
                        }
                        className="w-full py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold font-mono-num"
                      >
                        + Agendar em {format(cursorDate, 'dd/MM')}
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Painel de detalhes da tarefa */}
      <TaskDetailPane />

      {/* Visão do dia (+N mais) */}
      {expandedDayDate && (
        <div
          onClick={() => setExpandedDayDate(null)}
          className="fixed inset-0 z-50 bg-zinc-950/35 backdrop-blur-[1px] flex items-center justify-center p-4 animate-backdrop"
        >
          <div
            role="dialog"
            aria-label="Visão geral do dia"
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-zinc-200/90 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80dvh] animate-modal"
          >
            {(() => {
              const dayObj = parseISO(expandedDayDate);
              const dayTasks = sortDayTasks(
                activeTasks.filter((t) => isTaskDueOnDate(t, expandedDayDate))
              );
              const dayEvents = externalEvents.filter((ev) => ev.date === expandedDayDate);
              const completedCount = dayTasks.filter((t) => t.status === 'completed').length;

              return (
                <>
                  <div className="px-4 py-3 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                        {format(dayObj, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <p className="text-[11px] font-mono-num text-zinc-500 mt-0.5">
                        {dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}
                        {dayEvents.length > 0 ? ` · ${dayEvents.length} eventos` : ''}
                        {completedCount > 0 ? ` · ${completedCount} concluídas` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Fechar visão do dia"
                      onClick={() => setExpandedDayDate(null)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors"
                    >
                      <X className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{ borderLeftColor: ev.color }}
                        className="px-3 py-2 rounded-lg bg-sky-50/60 border border-sky-200/60 border-l-[3px] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-800 truncate">{ev.title}</div>
                          <div className="text-[10px] text-zinc-500">{ev.calendarName}</div>
                        </div>
                        <span className="font-mono-num text-[11px] text-zinc-600 shrink-0 ml-2">
                          {ev.startTime} – {ev.endTime}
                        </span>
                      </div>
                    ))}

                    {dayTasks.length === 0 && dayEvents.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-400">
                        Nenhuma tarefa agendada para esta data.
                      </div>
                    ) : (
                      dayTasks.map((t) => {
                        const isDone = t.status === 'completed';
                        const accentColor = getTaskAccentColor(t);
                        const taskList = lists.find((l) => l.id === t.listId);

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedCellDate(expandedDayDate);
                              setSelectedTaskId(t.id);
                              setExpandedDayDate(null);
                            }}
                            style={{ borderLeftColor: accentColor }}
                            className={`px-3 py-2 rounded-lg border border-zinc-200/70 border-l-[3px] flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-zinc-50/60 text-zinc-400'
                                : 'bg-white hover:bg-zinc-50 text-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleTaskStatus(t.id)}
                                className="rounded text-zinc-900 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate flex items-center gap-1.5">
                                  <span className="truncate">{t.title}</span>
                                  {t.recurrenceRule && (
                                    <Repeat className="w-3 h-3 text-zinc-400 shrink-0" />
                                  )}
                                </div>
                                {taskList && (
                                  <div className="text-[10px] text-zinc-400 truncate">{taskList.name}</div>
                                )}
                              </div>
                            </div>

                            <span className="font-mono-num text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                              {t.startTime || 'Dia inteiro'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={handleCreateInExpandedDay}
                    className="p-3 border-t border-zinc-200/80 bg-zinc-50/60 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={expandedDayNewTitle}
                      onChange={(e) => setExpandedDayNewTitle(e.target.value)}
                      placeholder={`+ Nova tarefa em ${format(dayObj, 'dd/MM')}...`}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shrink-0"
                    >
                      Adicionar
                    </button>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {createModal && (
        <div
          onClick={() => setCreateModal(null)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateFromDrag}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-3 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">Nova tarefa</h3>
            <p className="text-[11px] font-mono-num text-zinc-500">
              {format(parseISO(createModal.dateStr), 'dd/MM/yyyy')} · {minutesToTime(createModal.startMin)} –{' '}
              {minutesToTime(createModal.endMin)} ({createModal.endMin - createModal.startMin} min)
            </p>
            <input
              type="text"
              autoFocus
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Título da tarefa..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Criar tarefa rápida em um dia */}
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
              Agendar tarefa em {format(parseISO(quickCellDate), 'dd/MM/yyyy')}
            </h3>
            <input
              type="text"
              autoFocus
              required
              value={quickCellTitle}
              onChange={(e) => setQuickCellTitle(e.target.value)}
              placeholder="Título da tarefa..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickCellDate(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Adicionar ao calendário
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assinaturas de calendários externos */}
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
                Agendas externas
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
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
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
                    {sub.enabled ? 'Sincronizada' : 'Pausada'}
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (subName.trim() && subUrl.trim()) {
                  const normalizedUrl = normalizeIcsUrl(subUrl);
                  if (!normalizedUrl) {
                    setSubError('Use uma URL https://, http:// ou webcal://.');
                    return;
                  }
                  setSubError('');
                  addCalendarSubscription(subName.trim(), normalizedUrl, subProvider, PROVIDER_COLORS[subProvider]);
                  setSubName('');
                  setSubUrl('');
                }
              }}
              className="space-y-2.5 pt-2 border-t border-zinc-200/80"
            >
              <div className="text-xs font-semibold text-zinc-700">Conectar por URL ICS / webcal</div>
              {subError && <p className="text-[11px] text-red-600">{subError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Nome da agenda (ex.: Outlook)"
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
                  <option value="ics">Feed ICS personalizado</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                placeholder="webcal://… ou https://…/agenda.ics"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} /> Conectar agenda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

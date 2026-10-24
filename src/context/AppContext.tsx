import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ToastItem } from '../components/SonnerToaster';
import {
  INITIAL_CALENDAR_SUBSCRIPTIONS,
  INITIAL_COUNTDOWNS,
  INITIAL_FILTERS,
  INITIAL_FOLDERS,
  INITIAL_HABITS,
  INITIAL_LISTS,
  INITIAL_POMODORO_SESSIONS,
  INITIAL_PREFERENCES,
  INITIAL_SECTIONS,
  INITIAL_TAGS,
  INITIAL_TASKS,
  INITIAL_TEMPLATES,
} from '../data/seedData';
import { getSupabaseClient, getSupabaseConfig, saveRuntimeSupabaseConfig } from '../lib/supabase';
import {
  CalendarSubscription,
  CountdownItem,
  CustomFilter,
  Folder,
  Habit,
  HabitLogEntry,
  PomodoroSession,
  PrimaryModule,
  Priority,
  SmartListId,
  TagItem,
  Task,
  TaskList,
  TaskSection,
  TaskStatus,
  TaskTemplate,
  ThemeId,
  UserPreferences,
  ViewMode,
} from '../types';
import { soundEngine, WhiteNoiseId } from '../utils/soundEngine';

const STORAGE_PREFIX = 'ticktick_pro_v2_';

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export type ActiveSidebarSelection =
  | { kind: 'smart'; id: SmartListId }
  | { kind: 'list'; id: string }
  | { kind: 'tag'; id: string }
  | { kind: 'filter'; id: string };

interface AppContextValue {
  // Navigation & Selection
  activeModule: PrimaryModule;
  setActiveModule: (mod: PrimaryModule) => void;
  sidebarSelection: ActiveSidebarSelection;
  setSidebarSelection: (sel: ActiveSidebarSelection) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  isCommandOpen: boolean;
  setIsCommandOpen: (v: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  settingsInitialTab: 'general' | 'themes' | 'supabase' | 'shortcuts' | 'premium';
  openSettingsTab: (tab: 'general' | 'themes' | 'supabase' | 'shortcuts' | 'premium') => void;

  // Sonner Stacked Toasts
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Core Entities
  tasks: Task[];
  lists: TaskList[];
  folders: Folder[];
  sections: TaskSection[];
  tags: TagItem[];
  customFilters: CustomFilter[];
  habits: Habit[];
  pomodoroSessions: PomodoroSession[];
  countdowns: CountdownItem[];
  templates: TaskTemplate[];
  calendarSubscriptions: CalendarSubscription[];
  preferences: UserPreferences;

  // Task Operations
  addTask: (partial: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>, activityNote?: string) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string, permanent?: boolean) => void;
  restoreTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addTaskComment: (taskId: string, text: string) => void;
  addTaskAttachment: (
    taskId: string,
    name: string,
    url: string,
    type?: 'image' | 'pdf' | 'doc' | 'link'
  ) => void;
  saveTaskAsTemplate: (taskId: string) => void;
  applyTemplate: (templateId: string, listId?: string) => Task | null;

  // List, Folder, Section, Tag & Filter Operations
  addList: (name: string, color: string, folderId?: string, viewMode?: ViewMode) => TaskList;
  updateList: (id: string, patch: Partial<TaskList>) => void;
  deleteList: (id: string) => void;
  addFolder: (name: string) => void;
  toggleFolderCollapse: (id: string) => void;
  addSection: (listId: string, name: string) => TaskSection;
  addTag: (name: string, color: string) => void;
  deleteTag: (id: string) => void;
  addCustomFilter: (filter: Omit<CustomFilter, 'id'>) => void;
  deleteCustomFilter: (id: string) => void;

  // Habit Operations
  addHabit: (habit: Omit<Habit, 'id' | 'logs' | 'createdAt'>) => void;
  toggleHabitDate: (
    habitId: string,
    dateStr: string,
    valueDelta?: number,
    note?: string,
    mood?: HabitLogEntry['mood']
  ) => void;
  deleteHabit: (id: string) => void;

  // Pomodoro & Focus Timer Global State
  pomoMode: 'pomo' | 'stopwatch';
  setPomoMode: (m: 'pomo' | 'stopwatch') => void;
  pomoPhase: 'work' | 'short_break' | 'long_break';
  setPomoPhase: (p: 'work' | 'short_break' | 'long_break') => void;
  pomoRunning: boolean;
  setPomoRunning: (r: boolean) => void;
  pomoSecondsLeft: number;
  stopwatchSeconds: number;
  activePomoTaskId: string | null;
  setActivePomoTaskId: (id: string | null) => void;
  activeWhiteNoise: WhiteNoiseId;
  setActiveWhiteNoise: (id: WhiteNoiseId) => void;
  whiteNoiseVolume: number;
  setWhiteNoiseVolume: (v: number) => void;
  resetPomoTimer: () => void;
  completeCurrentPomoSession: (note?: string) => void;
  logManualFocusSession: (
    taskTitle: string,
    durationMinutes: number,
    startTime: string,
    note: string,
    taskId?: string
  ) => void;

  // Countdowns & Calendar Subscriptions
  addCountdown: (item: Omit<CountdownItem, 'id'>) => void;
  deleteCountdown: (id: string) => void;
  addCalendarSubscription: (
    name: string,
    url: string,
    provider: CalendarSubscription['provider'],
    color: string
  ) => void;
  toggleCalendarSubscription: (id: string) => void;

  // Preferences & Themes
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  setTheme: (theme: ThemeId) => void;
  resetDemoWorkspace: () => void;

  // Supabase Backend Sync
  supabaseStatus: 'local_only' | 'connected' | 'syncing' | 'error';
  supabaseUserEmail: string | null;
  supabaseLastSyncedAt: string | null;
  supabaseErrorMessage: string | null;
  connectSupabase: (url: string, anonKey: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  syncWorkspaceToSupabase: () => Promise<{ ok: boolean; message: string }>;
  pullWorkspaceFromSupabase: () => Promise<{ ok: boolean; message: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<PrimaryModule>('tasks');
  const [sidebarSelection, setSidebarSelection] = useState<ActiveSidebarSelection>({
    kind: 'smart',
    id: 'today',
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;
    return 'task-1';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
    return false;
  });
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'themes' | 'supabase' | 'shortcuts' | 'premium'
  >('general');

  // Sonner Stacked Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [{ ...toast, id }, ...prev.slice(0, 4)]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  // Core data persisted in localStorage + synced to Supabase
  const [tasks, setTasks] = useState<Task[]>(() => loadStored('tasks', INITIAL_TASKS));
  const [lists, setLists] = useState<TaskList[]>(() => loadStored('lists', INITIAL_LISTS));
  const [folders, setFolders] = useState<Folder[]>(() => loadStored('folders', INITIAL_FOLDERS));
  const [sections, setSections] = useState<TaskSection[]>(() =>
    loadStored('sections', INITIAL_SECTIONS)
  );
  const [tags, setTags] = useState<TagItem[]>(() => loadStored('tags', INITIAL_TAGS));
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>(() =>
    loadStored('filters', INITIAL_FILTERS)
  );
  const [habits, setHabits] = useState<Habit[]>(() => loadStored('habits', INITIAL_HABITS));
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>(() =>
    loadStored('pomo_sessions', INITIAL_POMODORO_SESSIONS)
  );
  const [countdowns, setCountdowns] = useState<CountdownItem[]>(() =>
    loadStored('countdowns', INITIAL_COUNTDOWNS)
  );
  const [templates, setTemplates] = useState<TaskTemplate[]>(() =>
    loadStored('templates', INITIAL_TEMPLATES)
  );
  const [calendarSubscriptions, setCalendarSubscriptions] = useState<CalendarSubscription[]>(() =>
    loadStored('cal_subs', INITIAL_CALENDAR_SUBSCRIPTIONS)
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    loadStored('preferences', INITIAL_PREFERENCES)
  );

  useEffect(() => saveStored('tasks', tasks), [tasks]);
  useEffect(() => saveStored('lists', lists), [lists]);
  useEffect(() => saveStored('folders', folders), [folders]);
  useEffect(() => saveStored('sections', sections), [sections]);
  useEffect(() => saveStored('tags', tags), [tags]);
  useEffect(() => saveStored('filters', customFilters), [customFilters]);
  useEffect(() => saveStored('habits', habits), [habits]);
  useEffect(() => saveStored('pomo_sessions', pomodoroSessions), [pomodoroSessions]);
  useEffect(() => saveStored('countdowns', countdowns), [countdowns]);
  useEffect(() => saveStored('templates', templates), [templates]);
  useEffect(() => saveStored('cal_subs', calendarSubscriptions), [calendarSubscriptions]);
  useEffect(() => saveStored('preferences', preferences), [preferences]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pomodoro & Stopwatch global timer state
  const [pomoMode, setPomoMode] = useState<'pomo' | 'stopwatch'>('pomo');
  const [pomoPhase, setPomoPhase] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(preferences.pomoDuration * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [activePomoTaskId, setActivePomoTaskId] = useState<string | null>('task-1');
  const [activeWhiteNoise, setActiveWhiteNoiseState] = useState<WhiteNoiseId>('none');
  const [whiteNoiseVolume, setWhiteNoiseVolumeState] = useState(0.35);

  useEffect(() => {
    if (!pomoRunning) {
      if (pomoPhase === 'work') setPomoSecondsLeft(preferences.pomoDuration * 60);
      else if (pomoPhase === 'short_break')
        setPomoSecondsLeft(preferences.shortBreakDuration * 60);
      else setPomoSecondsLeft(preferences.longBreakDuration * 60);
    }
  }, [
    pomoPhase,
    preferences.pomoDuration,
    preferences.shortBreakDuration,
    preferences.longBreakDuration,
    pomoRunning,
  ]);

  useEffect(() => {
    if (pomoRunning && activeWhiteNoise !== 'none') {
      soundEngine.startWhiteNoise(activeWhiteNoise, whiteNoiseVolume);
    } else {
      soundEngine.stopWhiteNoise();
    }
    return () => {
      if (!pomoRunning) soundEngine.stopWhiteNoise();
    };
  }, [pomoRunning, activeWhiteNoise, whiteNoiseVolume]);

  const setActiveWhiteNoise = (id: WhiteNoiseId) => {
    setActiveWhiteNoiseState(id);
    if (pomoRunning) {
      soundEngine.startWhiteNoise(id, whiteNoiseVolume);
    }
  };

  const setWhiteNoiseVolume = (vol: number) => {
    setWhiteNoiseVolumeState(vol);
    soundEngine.setVolume(vol);
  };

  useEffect(() => {
    if (!pomoRunning) return;
    const interval = window.setInterval(() => {
      if (pomoMode === 'pomo') {
        setPomoSecondsLeft((prev) => {
          if (prev <= 1) {
            soundEngine.playPomodoroCompleteAlarm();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setStopwatchSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pomoRunning, pomoMode]);

  const resetPomoTimer = () => {
    setPomoRunning(false);
    soundEngine.stopWhiteNoise();
    if (pomoMode === 'pomo') {
      if (pomoPhase === 'work') setPomoSecondsLeft(preferences.pomoDuration * 60);
      else if (pomoPhase === 'short_break')
        setPomoSecondsLeft(preferences.shortBreakDuration * 60);
      else setPomoSecondsLeft(preferences.longBreakDuration * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const completeCurrentPomoSession = (note = '') => {
    const now = new Date();
    const elapsedMinutes =
      pomoMode === 'pomo'
        ? Math.max(
            1,
            Math.round((preferences.pomoDuration * 60 - pomoSecondsLeft) / 60) ||
              preferences.pomoDuration
          )
        : Math.max(1, Math.round(stopwatchSeconds / 60));

    const targetTask = tasks.find((t) => t.id === activePomoTaskId);
    const session: PomodoroSession = {
      id: `pomo-${Date.now()}`,
      taskId: targetTask?.id,
      taskTitle: targetTask?.title || 'Deep Focus Session',
      mode: pomoMode,
      startTime: new Date(now.getTime() - elapsedMinutes * 60 * 1000).toISOString(),
      endTime: now.toISOString(),
      durationMinutes: elapsedMinutes,
      note: note || `Focused for ${elapsedMinutes} minutes`,
      whiteNoiseUsed: activeWhiteNoise !== 'none' ? activeWhiteNoise : undefined,
    };

    setPomodoroSessions((prev) => [session, ...prev]);

    if (targetTask) {
      updateTask(
        targetTask.id,
        {
          completedPomos: targetTask.completedPomos + 1,
          focusSeconds: targetTask.focusSeconds + elapsedMinutes * 60,
        },
        `Logged ${elapsedMinutes}m Pomodoro focus session`
      );
    }

    setPreferences((prev) => ({
      ...prev,
      achievementScore: prev.achievementScore + 15,
    }));

    if (preferences.soundAlertEnabled) {
      soundEngine.playPomodoroCompleteAlarm();
    }
    pushToast({
      title: `Focus session logged (+${elapsedMinutes}m)`,
      description: targetTask ? targetTask.title : 'Achievement Score +15',
      kind: 'success',
    });
    resetPomoTimer();
  };

  const logManualFocusSession = (
    taskTitle: string,
    durationMinutes: number,
    startTime: string,
    note: string,
    taskId?: string
  ) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const session: PomodoroSession = {
      id: `pomo-${Date.now()}`,
      taskId,
      taskTitle: taskTitle || 'Manual Focus Session',
      mode: 'pomo',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes,
      note,
    };
    setPomodoroSessions((prev) => [session, ...prev]);
    if (taskId) {
      const target = tasks.find((t) => t.id === taskId);
      if (target) {
        updateTask(
          taskId,
          {
            completedPomos: target.completedPomos + Math.max(1, Math.round(durationMinutes / 25)),
            focusSeconds: target.focusSeconds + durationMinutes * 60,
          },
          `Added manual focus record (${durationMinutes}m)`
        );
      }
    }
    pushToast({
      title: 'Manual focus record saved',
      description: `${taskTitle} (${durationMinutes}m)`,
      kind: 'success',
    });
  };

  const addTask = (partial: Partial<Task> & { title: string }): Task => {
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: partial.title,
      content: partial.content ?? '',
      isNote: partial.isNote ?? false,
      listId: partial.listId ?? 'inbox',
      sectionId: partial.sectionId,
      status: partial.status ?? 'todo',
      priority: partial.priority ?? 0,
      tags: partial.tags ?? [],
      startDate: partial.startDate ?? partial.dueDate,
      dueDate: partial.dueDate,
      startTime: partial.startTime,
      endTime: partial.endTime,
      isAllDay: partial.isAllDay ?? !partial.startTime,
      durationMinutes: partial.durationMinutes,
      recurrenceRule: partial.recurrenceRule,
      reminders: partial.reminders ?? (partial.startTime ? ['On time'] : []),
      constantReminder: partial.constantReminder ?? false,
      emailReminder: partial.emailReminder ?? false,
      locationReminder: partial.locationReminder,
      assignee: partial.assignee,
      estimatedPomos: partial.estimatedPomos ?? 1,
      completedPomos: 0,
      focusSeconds: 0,
      subtasks: partial.subtasks ?? [],
      attachments: partial.attachments ?? [],
      comments: partial.comments ?? [],
      activities: [
        {
          id: `act-${Date.now()}`,
          actor: preferences.fullName,
          action: 'Created task',
          timestamp: format(new Date(), 'yyyy-MM-dd HH:mm'),
        },
      ],
      eisenhowerQuadrant: partial.eisenhowerQuadrant,
      isPinned: partial.isPinned ?? false,
      sortOrder: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (newTask.tags.length > 0) {
      setTags((prevTags) => {
        const existingNames = new Set(prevTags.map((t) => t.name.toLowerCase()));
        const additions: TagItem[] = [];
        const palette = ['#2563eb', '#059669', '#d97706', '#0284c7', '#e11d48', '#0d9488'];
        newTask.tags.forEach((tagName, idx) => {
          if (!existingNames.has(tagName.toLowerCase())) {
            additions.push({
              id: `tag-${Date.now()}-${idx}`,
              name: tagName.toLowerCase(),
              color: palette[(prevTags.length + idx) % palette.length],
            });
          }
        });
        return additions.length > 0 ? [...prevTags, ...additions] : prevTags;
      });
    }

    setTasks((prev) => [newTask, ...prev]);
    if (typeof window === 'undefined' || window.innerWidth >= 1024) {
      setSelectedTaskId(newTask.id);
    }
    pushToast({
      title: 'Task added',
      description: newTask.title,
      kind: 'action',
    });
    return newTask;
  };

  const updateTask = (id: string, patch: Partial<Task>, activityNote?: string) => {
    const nowFormatted = format(new Date(), 'yyyy-MM-dd HH:mm');
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextActivities = activityNote
          ? [
              {
                id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                actor: preferences.fullName,
                action: activityNote,
                timestamp: nowFormatted,
              },
              ...task.activities,
            ]
          : task.activities;
        return {
          ...task,
          ...patch,
          activities: nextActivities,
          updatedAt: format(new Date(), 'yyyy-MM-dd'),
        };
      })
    );
  };

  const toggleTaskStatus = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const isCompleting = target.status !== 'completed';
    if (isCompleting && preferences.soundAlertEnabled) {
      soundEngine.playCompletionBell();
      setPreferences((prev) => ({ ...prev, achievementScore: prev.achievementScore + 8 }));
    }
    updateTask(
      id,
      {
        status: isCompleting ? 'completed' : 'todo',
        completedAt: isCompleting ? new Date().toISOString() : undefined,
      },
      isCompleting ? 'Marked task as completed' : 'Reopened task'
    );

    if (isCompleting) {
      pushToast({
        title: 'Task completed',
        description: target.title,
        kind: 'success',
        onUndo: () => {
          updateTask(id, { status: 'todo', completedAt: undefined }, 'Reopened task via Undo');
        },
      });
    }
  };

  const deleteTask = (id: string, permanent = false) => {
    const target = tasks.find((t) => t.id === id);
    if (permanent) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) setSelectedTaskId(null);
      pushToast({ title: 'Task permanently deleted', kind: 'info' });
    } else {
      updateTask(id, { status: 'trash' }, 'Moved task to Trash');
      pushToast({
        title: 'Moved to Trash',
        description: target?.title,
        kind: 'info',
        onUndo: () => restoreTask(id),
      });
    }
  };

  const restoreTask = (id: string) => {
    updateTask(id, { status: 'todo' }, 'Restored task from Trash');
    pushToast({ title: 'Task restored', kind: 'success' });
  };

  const duplicateTask = (id: string) => {
    const orig = tasks.find((t) => t.id === id);
    if (!orig) return;
    addTask({
      ...orig,
      title: `${orig.title} (Copy)`,
      status: 'todo',
      subtasks: orig.subtasks.map((s) => ({ ...s, id: `sub-${Date.now()}-${Math.random()}` })),
    });
  };

  const addSubtask = (taskId: string, title: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !title.trim()) return;
    const nextSubtasks = [
      ...task.subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: title.trim(),
        completed: false,
      },
    ];
    updateTask(taskId, { subtasks: nextSubtasks }, `Added checklist item "${title.trim()}"`);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTask(taskId, { subtasks: nextSubtasks });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
    });
  };

  const addTaskComment = (taskId: string, text: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !text.trim()) return;
    const nextComments = [
      ...task.comments,
      {
        id: `com-${Date.now()}`,
        author: preferences.fullName,
        avatarColor: '#2563eb',
        text: text.trim(),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
      },
    ];
    updateTask(taskId, { comments: nextComments }, 'Added a comment');
  };

  const addTaskAttachment = (
    taskId: string,
    name: string,
    url: string,
    type: 'image' | 'pdf' | 'doc' | 'link' = 'link'
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !name.trim()) return;
    const nextAttachments = [
      ...task.attachments,
      {
        id: `att-${Date.now()}`,
        name: name.trim(),
        size: type === 'link' ? 'External URL' : '420 KB',
        type,
        url: url.trim() || '#',
        uploadedAt: format(new Date(), 'yyyy-MM-dd'),
      },
    ];
    updateTask(taskId, { attachments: nextAttachments }, `Attached "${name.trim()}"`);
  };

  const saveTaskAsTemplate = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newTpl: TaskTemplate = {
      id: `tpl-${Date.now()}`,
      name: task.title,
      category: 'Custom',
      title: task.title,
      content: task.content,
      priority: task.priority,
      tags: [...task.tags],
      durationMinutes: task.durationMinutes,
      subtasks: task.subtasks.map((s) => ({ title: s.title })),
    };
    setTemplates((prev) => [newTpl, ...prev]);
    updateTask(taskId, {}, 'Saved task as reusable Template');
    pushToast({
      title: 'Saved to Templates Hub',
      description: task.title,
      kind: 'success',
    });
  };

  const applyTemplate = (templateId: string, listId = 'inbox'): Task | null => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return addTask({
      title: tpl.title,
      content: tpl.content,
      priority: tpl.priority,
      tags: [...tpl.tags],
      listId,
      dueDate: todayStr,
      startDate: todayStr,
      durationMinutes: tpl.durationMinutes,
      subtasks: tpl.subtasks.map((s, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: s.title,
        completed: false,
      })),
    });
  };

  const addList = (
    name: string,
    color: string,
    folderId?: string,
    viewMode: ViewMode = 'list'
  ) => {
    const newList: TaskList = {
      id: `list-${Date.now()}`,
      folderId,
      name: name.trim(),
      color,
      icon: 'list',
      backgroundStyle: 'none',
      viewMode,
      isShared: false,
      members: [],
      sortOrder: lists.length,
    };
    setLists((prev) => [...prev, newList]);
    if (viewMode === 'kanban') {
      setSections((prev) => [
        ...prev,
        { id: `sec-${Date.now()}-1`, listId: newList.id, name: 'To Do', sortOrder: 0 },
        { id: `sec-${Date.now()}-2`, listId: newList.id, name: 'In Progress', sortOrder: 1 },
        { id: `sec-${Date.now()}-3`, listId: newList.id, name: 'Done', sortOrder: 2 },
      ]);
    }
    pushToast({ title: `Created list "${newList.name}"`, kind: 'success' });
    return newList;
  };

  const updateList = (id: string, patch: Partial<TaskList>) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const deleteList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setTasks((prev) => prev.map((t) => (t.listId === id ? { ...t, listId: 'inbox' } : t)));
    if (sidebarSelection.kind === 'list' && sidebarSelection.id === id) {
      setSidebarSelection({ kind: 'smart', id: 'inbox' });
    }
  };

  const addFolder = (name: string) => {
    if (!name.trim()) return;
    setFolders((prev) => [
      ...prev,
      {
        id: `folder-${Date.now()}`,
        name: name.trim(),
        isCollapsed: false,
        sortOrder: prev.length,
      },
    ]);
  };

  const toggleFolderCollapse = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isCollapsed: !f.isCollapsed } : f))
    );
  };

  const addSection = (listId: string, name: string): TaskSection => {
    const sec: TaskSection = {
      id: `sec-${Date.now()}`,
      listId,
      name: name.trim(),
      sortOrder: sections.filter((s) => s.listId === listId).length,
    };
    setSections((prev) => [...prev, sec]);
    return sec;
  };

  const addTag = (name: string, color: string) => {
    const clean = name.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    setTags((prev) => {
      if (prev.some((t) => t.name === clean)) return prev;
      return [...prev, { id: `tag-${Date.now()}`, name: clean, color }];
    });
  };

  const deleteTag = (id: string) => {
    const target = tags.find((t) => t.id === id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          tags: task.tags.filter((tg) => tg !== target.name),
        }))
      );
    }
  };

  const addCustomFilter = (filter: Omit<CustomFilter, 'id'>) => {
    setCustomFilters((prev) => [...prev, { ...filter, id: `filter-${Date.now()}` }]);
    pushToast({ title: `Saved filter "${filter.name}"`, kind: 'success' });
  };

  const deleteCustomFilter = (id: string) => {
    setCustomFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'logs' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}`,
      logs: {},
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, newHabit]);
    pushToast({ title: `Habit "${habit.name}" added`, kind: 'success' });
  };

  const toggleHabitDate = (
    habitId: string,
    dateStr: string,
    valueDelta?: number,
    note?: string,
    mood?: HabitLogEntry['mood']
  ) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const existing = habit.logs[dateStr];
        const nextLogs = { ...habit.logs };

        if (habit.goalType === 'check') {
          if (existing?.completed && !note && !mood) {
            delete nextLogs[dateStr];
          } else {
            nextLogs[dateStr] = {
              value: 1,
              completed: true,
              note: note ?? existing?.note,
              mood: mood ?? existing?.mood ?? 'great',
              timestamp: new Date().toISOString(),
            };
            if (preferences.soundAlertEnabled) soundEngine.playCompletionBell();
          }
        } else {
          const step = valueDelta ?? Math.max(1, Math.round(habit.targetValue / 4));
          const currentVal = existing?.value ?? 0;
          const nextVal =
            currentVal >= habit.targetValue && !valueDelta ? 0 : currentVal + step;
          if (nextVal <= 0) {
            delete nextLogs[dateStr];
          } else {
            const completed = nextVal >= habit.targetValue;
            if (completed && !existing?.completed && preferences.soundAlertEnabled) {
              soundEngine.playCompletionBell();
            }
            nextLogs[dateStr] = {
              value: nextVal,
              completed,
              note: note ?? existing?.note,
              mood: mood ?? existing?.mood ?? 'good',
              timestamp: new Date().toISOString(),
            };
          }
        }

        return { ...habit, logs: nextLogs };
      })
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const addCountdown = (item: Omit<CountdownItem, 'id'>) => {
    setCountdowns((prev) => [{ ...item, id: `cd-${Date.now()}` }, ...prev]);
    pushToast({ title: `Countdown "${item.title}" created`, kind: 'success' });
  };

  const deleteCountdown = (id: string) => {
    setCountdowns((prev) => prev.filter((c) => c.id !== id));
  };

  const addCalendarSubscription = (
    name: string,
    url: string,
    provider: CalendarSubscription['provider'],
    color: string
  ) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setCalendarSubscriptions((prev) => [
      ...prev,
      {
        id: `calsub-${Date.now()}`,
        name,
        url,
        provider,
        color,
        enabled: true,
        events: [
          {
            id: `ext-${Date.now()}`,
            title: `${name} Synced Event`,
            date: todayStr,
            startTime: '11:00',
            endTime: '12:00',
            location: 'External Calendar',
          },
        ],
      },
    ]);
    pushToast({ title: `Subscribed to ${name}`, kind: 'success' });
  };

  const toggleCalendarSubscription = (id: string) => {
    setCalendarSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  };

  const setTheme = (theme: ThemeId) => {
    updatePreferences({ theme });
    pushToast({ title: `Theme updated`, description: theme, kind: 'info' });
  };

  const openSettingsTab = (
    tab: 'general' | 'themes' | 'supabase' | 'shortcuts' | 'premium'
  ) => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  const resetDemoWorkspace = () => {
    setTasks(INITIAL_TASKS);
    setLists(INITIAL_LISTS);
    setFolders(INITIAL_FOLDERS);
    setSections(INITIAL_SECTIONS);
    setTags(INITIAL_TAGS);
    setCustomFilters(INITIAL_FILTERS);
    setHabits(INITIAL_HABITS);
    setPomodoroSessions(INITIAL_POMODORO_SESSIONS);
    setCountdowns(INITIAL_COUNTDOWNS);
    setTemplates(INITIAL_TEMPLATES);
    setCalendarSubscriptions(INITIAL_CALENDAR_SUBSCRIPTIONS);
    setPreferences(INITIAL_PREFERENCES);
    pushToast({ title: 'Sample workspace restored', kind: 'info' });
  };

  // Supabase connection & sync state
  const [supabaseStatus, setSupabaseStatus] = useState<
    'local_only' | 'connected' | 'syncing' | 'error'
  >(() => (getSupabaseConfig().isConfigured ? 'connected' : 'local_only'));
  const [supabaseUserEmail, setSupabaseUserEmail] = useState<string | null>(null);
  const [supabaseLastSyncedAt, setSupabaseLastSyncedAt] = useState<string | null>(null);
  const [supabaseErrorMessage, setSupabaseErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setSupabaseStatus('local_only');
      return;
    }
    setSupabaseStatus('connected');
    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.email) {
        setSupabaseUserEmail(data.session.user.email);
      }
    });
  }, []);

  const connectSupabase = async (url: string, anonKey: string): Promise<boolean> => {
    saveRuntimeSupabaseConfig(url, anonKey);
    const client = getSupabaseClient();
    if (!client) {
      setSupabaseStatus('local_only');
      return false;
    }
    setSupabaseStatus('syncing');
    setSupabaseErrorMessage(null);
    try {
      const { error } = await client.auth.getSession();
      if (error) {
        setSupabaseStatus('error');
        setSupabaseErrorMessage(error.message);
        return false;
      }
      setSupabaseStatus('connected');
      setSupabaseLastSyncedAt(format(new Date(), 'HH:mm:ss'));
      pushToast({ title: 'Connected to Supabase backend', kind: 'success' });
      return true;
    } catch (err) {
      setSupabaseStatus('error');
      setSupabaseErrorMessage(
        err instanceof Error ? err.message : 'Failed to connect to Supabase'
      );
      return false;
    }
  };

  const disconnectSupabase = () => {
    saveRuntimeSupabaseConfig('', '');
    setSupabaseStatus('local_only');
    setSupabaseUserEmail(null);
    setSupabaseErrorMessage(null);
    pushToast({ title: 'Switched to Local-First storage', kind: 'info' });
  };

  const syncWorkspaceToSupabase = async (): Promise<{ ok: boolean; message: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, message: 'Supabase URL & Anon Key are not configured yet.' };
    }
    setSupabaseStatus('syncing');
    setSupabaseErrorMessage(null);
    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setSupabaseStatus('connected');
        return {
          ok: false,
          message:
            'Connected to Supabase endpoint. Sign in with a Supabase user account to write rows under RLS.',
        };
      }

      const taskRows = tasks.map((t) => ({
        id: t.id.startsWith('task-') ? undefined : t.id,
        user_id: userId,
        list_id: t.listId,
        title: t.title,
        content: t.content,
        is_note: t.isNote,
        status: t.status,
        priority: t.priority,
        tags: t.tags,
        due_date: t.dueDate || null,
        duration_minutes: t.durationMinutes || null,
        constant_reminder: t.constantReminder,
        email_reminder: t.emailReminder,
        subtasks: t.subtasks,
        comments: t.comments,
        activities: t.activities,
      }));

      const { error } = await client.from('tasks').upsert(taskRows);
      if (error) throw error;

      const syncedTime = format(new Date(), 'HH:mm:ss');
      setSupabaseLastSyncedAt(syncedTime);
      setSupabaseStatus('connected');
      return {
        ok: true,
        message: `Synced ${tasks.length} tasks & workspace state at ${syncedTime}.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSupabaseStatus('error');
      setSupabaseErrorMessage(msg);
      return { ok: false, message: msg };
    }
  };

  const pullWorkspaceFromSupabase = async (): Promise<{ ok: boolean; message: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, message: 'Supabase URL & Anon Key are not configured yet.' };
    }
    setSupabaseStatus('syncing');
    setSupabaseErrorMessage(null);
    try {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Task[] = data.map((row: Record<string, unknown>, idx: number) => ({
          id: String(row.id),
          title: String(row.title || 'Untitled'),
          content: String(row.content || ''),
          isNote: Boolean(row.is_note),
          listId: String(row.list_id || 'inbox'),
          status: (row.status as TaskStatus) || 'todo',
          priority: (Number(row.priority) as Priority) || 0,
          tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
          dueDate: row.due_date ? String(row.due_date).slice(0, 10) : undefined,
          isAllDay: Boolean(row.is_all_day ?? true),
          durationMinutes: row.duration_minutes ? Number(row.duration_minutes) : undefined,
          reminders: Array.isArray(row.reminders) ? (row.reminders as string[]) : [],
          constantReminder: Boolean(row.constant_reminder),
          emailReminder: Boolean(row.email_reminder),
          estimatedPomos: Number(row.estimated_pomos || 1),
          completedPomos: Number(row.completed_pomos || 0),
          focusSeconds: Number(row.focus_seconds || 0),
          subtasks: Array.isArray(row.subtasks) ? (row.subtasks as Task['subtasks']) : [],
          attachments: Array.isArray(row.attachments)
            ? (row.attachments as Task['attachments'])
            : [],
          comments: Array.isArray(row.comments) ? (row.comments as Task['comments']) : [],
          activities: Array.isArray(row.activities)
            ? (row.activities as Task['activities'])
            : [],
          isPinned: Boolean(row.is_pinned),
          sortOrder: idx,
          createdAt: String(row.created_at || new Date().toISOString()).slice(0, 10),
          updatedAt: String(row.updated_at || new Date().toISOString()).slice(0, 10),
        }));
        setTasks(mapped);
      }

      const syncedTime = format(new Date(), 'HH:mm:ss');
      setSupabaseLastSyncedAt(syncedTime);
      setSupabaseStatus('connected');
      return {
        ok: true,
        message: `Pulled ${data?.length ?? 0} tasks from Supabase at ${syncedTime}.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pull failed';
      setSupabaseStatus('error');
      setSupabaseErrorMessage(msg);
      return { ok: false, message: msg };
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      activeModule,
      setActiveModule,
      sidebarSelection,
      setSidebarSelection,
      selectedTaskId,
      setSelectedTaskId,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isCommandOpen,
      setIsCommandOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      settingsInitialTab,
      openSettingsTab,
      toasts,
      pushToast,
      dismissToast,
      tasks,
      lists,
      folders,
      sections,
      tags,
      customFilters,
      habits,
      pomodoroSessions,
      countdowns,
      templates,
      calendarSubscriptions,
      preferences,
      addTask,
      updateTask,
      toggleTaskStatus,
      deleteTask,
      restoreTask,
      duplicateTask,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      addTaskComment,
      addTaskAttachment,
      saveTaskAsTemplate,
      applyTemplate,
      addList,
      updateList,
      deleteList,
      addFolder,
      toggleFolderCollapse,
      addSection,
      addTag,
      deleteTag,
      addCustomFilter,
      deleteCustomFilter,
      addHabit,
      toggleHabitDate,
      deleteHabit,
      pomoMode,
      setPomoMode,
      pomoPhase,
      setPomoPhase,
      pomoRunning,
      setPomoRunning,
      pomoSecondsLeft,
      stopwatchSeconds,
      activePomoTaskId,
      setActivePomoTaskId,
      activeWhiteNoise,
      setActiveWhiteNoise,
      whiteNoiseVolume,
      setWhiteNoiseVolume,
      resetPomoTimer,
      completeCurrentPomoSession,
      logManualFocusSession,
      addCountdown,
      deleteCountdown,
      addCalendarSubscription,
      toggleCalendarSubscription,
      updatePreferences,
      setTheme,
      resetDemoWorkspace,
      supabaseStatus,
      supabaseUserEmail,
      supabaseLastSyncedAt,
      supabaseErrorMessage,
      connectSupabase,
      disconnectSupabase,
      syncWorkspaceToSupabase,
      pullWorkspaceFromSupabase,
    }),
    [
      activeModule,
      sidebarSelection,
      selectedTaskId,
      isSidebarCollapsed,
      isCommandOpen,
      isSettingsOpen,
      settingsInitialTab,
      toasts,
      pushToast,
      dismissToast,
      tasks,
      lists,
      folders,
      sections,
      tags,
      customFilters,
      habits,
      pomodoroSessions,
      countdowns,
      templates,
      calendarSubscriptions,
      preferences,
      pomoMode,
      pomoPhase,
      pomoRunning,
      pomoSecondsLeft,
      stopwatchSeconds,
      activePomoTaskId,
      activeWhiteNoise,
      whiteNoiseVolume,
      supabaseStatus,
      supabaseUserEmail,
      supabaseLastSyncedAt,
      supabaseErrorMessage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Flame,
  Grid2X2,
  Hourglass,
  Search,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseNaturalLanguageTask } from '../utils/nlpParser';

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandOpen,
    setIsCommandOpen,
    tasks,
    lists,
    setActiveModule,
    setSelectedTaskId,
    setSidebarSelection,
    addTask,
    openSettingsTab,
  } = useApp();

  const [query, setQuery] = useState('');

  const matchingTasks = useMemo(() => {
    if (!query.trim()) return tasks.slice(0, 6);
    const q = query.toLowerCase();
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [tasks, query]);

  if (!isCommandOpen) return null;

  const quickActions = [
    {
      label: 'Go to Tasks Workspace',
      icon: <CheckSquare className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G T',
      action: () => {
        setActiveModule('tasks');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Go to Calendar (Month / Week / Day / 3-Day / Agenda)',
      icon: <Calendar className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G C',
      action: () => {
        setActiveModule('calendar');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Start Pomodoro Focus Timer & White Noise',
      icon: <Timer className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G P',
      action: () => {
        setActiveModule('pomodoro');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Open Habit Tracker',
      icon: <Flame className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G H',
      action: () => {
        setActiveModule('habits');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Open Eisenhower Matrix',
      icon: <Grid2X2 className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G M',
      action: () => {
        setActiveModule('matrix');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Open Countdowns & Templates Hub',
      icon: <Hourglass className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G D',
      action: () => {
        setActiveModule('countdown');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'View Productivity Statistics & Score',
      icon: <BarChart3 className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: 'G S',
      action: () => {
        setActiveModule('statistics');
        setIsCommandOpen(false);
      },
    },
    {
      label: 'Configure Supabase Cloud Backend & RLS Sync',
      icon: <Settings className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      shortcut: '⌘ ,',
      action: () => {
        setIsCommandOpen(false);
        openSettingsTab('supabase');
      },
    },
  ];

  const handleQuickCreateFromQuery = () => {
    if (!query.trim()) return;
    const parsed = parseNaturalLanguageTask(query);
    addTask({
      title: parsed.cleanTitle,
      dueDate: parsed.dueDate,
      startDate: parsed.dueDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      durationMinutes: parsed.durationMinutes,
      priority: parsed.priority ?? 0,
      tags: parsed.tags,
      recurrenceRule: parsed.recurrenceRule,
    });
    setQuery('');
    setActiveModule('tasks');
    setIsCommandOpen(false);
  };

  return (
    <div
      onClick={() => setIsCommandOpen(false)}
      className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-start justify-center pt-20 p-4 animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl surface-floating rounded-xl overflow-hidden animate-modal"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200/80">
          <Search className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsCommandOpen(false);
              if (e.key === 'Enter' && query.trim() && matchingTasks.length === 0) {
                handleQuickCreateFromQuery();
              }
            }}
            placeholder="Search tasks, jump to module, or type NLP task to create..."
            className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-500">
            ESC
          </kbd>
          <button
            onClick={() => setIsCommandOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {query.trim() && (
            <button
              onClick={handleQuickCreateFromQuery}
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold flex items-center justify-between"
            >
              <span>+ Create Task via Smart NLP: "{query}"</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/15 text-zinc-100">
                Enter
              </span>
            </button>
          )}

          {/* Matching Tasks */}
          <div>
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-num">
              Tasks ({matchingTasks.length})
            </div>
            <div className="space-y-0.5">
              {matchingTasks.map((t) => {
                const list = lists.find((l) => l.id === t.listId);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveModule('tasks');
                      if (t.listId === 'inbox') {
                        setSidebarSelection({ kind: 'smart', id: 'inbox' });
                      } else {
                        setSidebarSelection({ kind: 'list', id: t.listId });
                      }
                      setSelectedTaskId(t.id);
                      setIsCommandOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 text-xs text-zinc-800"
                  >
                    <span className="truncate font-medium">{t.title}</span>
                    <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                      {list?.name || 'Inbox'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Commands */}
          <div>
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Quick Navigation
            </div>
            <div className="space-y-0.5">
              {quickActions.map((act, i) => (
                <button
                  key={i}
                  onClick={act.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 text-xs text-zinc-700 font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    {act.icon}
                    <span>{act.label}</span>
                  </span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/80 font-mono text-[10px] text-zinc-500">
                    {act.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

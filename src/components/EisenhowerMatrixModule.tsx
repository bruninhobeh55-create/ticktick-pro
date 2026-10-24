import React, { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { Check, Grid2X2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority, Task } from '../types';
import { TaskDetailPane } from './TaskDetailPane';

export const EisenhowerMatrixModule: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, addTask, updateTask, toggleTaskStatus } =
    useApp();

  const [quadrantInputs, setQuadrantInputs] = useState<Record<'q1' | 'q2' | 'q3' | 'q4', string>>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  });

  const todayStr = format(startOfToday(), 'yyyy-MM-dd');

  const resolveTaskQuadrant = (task: Task): 'q1' | 'q2' | 'q3' | 'q4' => {
    if (task.eisenhowerQuadrant) return task.eisenhowerQuadrant;
    const isUrgent = Boolean(task.dueDate && task.dueDate <= todayStr);
    const isImportant = task.priority === 5 || task.priority === 3;
    if (isUrgent && isImportant) return 'q1';
    if (!isUrgent && isImportant) return 'q2';
    if (isUrgent && !isImportant) return 'q3';
    return 'q4';
  };

  const activeTasks = tasks.filter(
    (t) => t.status !== 'trash' && t.status !== 'wont_do' && !t.isNote
  );

  const quadrants: {
    id: 'q1' | 'q2' | 'q3' | 'q4';
    roman: string;
    title: string;
    subtitle: string;
    badgeBg: string;
    headerColor: string;
    defaultPriority: Priority;
    defaultDue?: string;
  }[] = [
    {
      id: 'q1',
      roman: 'I',
      title: 'Urgent & Important',
      subtitle: 'Do First — Critical deadlines & high impact',
      badgeBg: 'bg-rose-600 text-white',
      headerColor: 'border-zinc-200/80 bg-rose-50/40 text-zinc-900',
      defaultPriority: 5,
      defaultDue: todayStr,
    },
    {
      id: 'q2',
      roman: 'II',
      title: 'Not Urgent & Important',
      subtitle: 'Schedule — Strategic deep work & long-term growth',
      badgeBg: 'bg-amber-600 text-white',
      headerColor: 'border-zinc-200/80 bg-amber-50/40 text-zinc-900',
      defaultPriority: 3,
    },
    {
      id: 'q3',
      roman: 'III',
      title: 'Urgent & Not Important',
      subtitle: 'Delegate / Batch — Quick operational replies & errands',
      badgeBg: 'bg-blue-600 text-white',
      headerColor: 'border-zinc-200/80 bg-blue-50/40 text-zinc-900',
      defaultPriority: 1,
      defaultDue: todayStr,
    },
    {
      id: 'q4',
      roman: 'IV',
      title: 'Not Urgent & Not Important',
      subtitle: 'Eliminate / Someday — Low priority backlog',
      badgeBg: 'bg-emerald-600 text-white',
      headerColor: 'border-zinc-200/80 bg-emerald-50/40 text-zinc-900',
      defaultPriority: 0,
    },
  ];

  return (
    <div className="flex-1 flex h-full min-w-0 bg-zinc-50/60 overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
              <Grid2X2 className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
              Eisenhower Matrix
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Prioritize by Urgency and Importance. Add tasks directly into any quadrant or move tasks across quadrants.
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[540px]">
          {quadrants.map((q) => {
            const qTasks = activeTasks.filter((t) => resolveTaskQuadrant(t) === q.id);

            return (
              <section
                key={q.id}
                className="surface-card rounded-xl flex flex-col overflow-hidden"
              >
                {/* Quadrant Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${q.headerColor}`}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md text-xs font-mono-num font-bold flex items-center justify-center ${q.badgeBg}`}
                    >
                      {q.roman}
                    </span>
                    <div>
                      <h2 className="text-xs font-semibold text-zinc-900">{q.title}</h2>
                      <p className="text-[10px] text-zinc-500">{q.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono-num font-semibold px-2 py-0.5 rounded-md bg-white border border-zinc-200/70 text-zinc-700">
                    {qTasks.length}
                  </span>
                </div>

                {/* Quick Add in Quadrant */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = quadrantInputs[q.id].trim();
                    if (!text) return;
                    addTask({
                      title: text,
                      priority: q.defaultPriority,
                      dueDate: q.defaultDue,
                      startDate: q.defaultDue,
                      eisenhowerQuadrant: q.id,
                    });
                    setQuadrantInputs((prev) => ({ ...prev, [q.id]: '' }));
                  }}
                  className="px-3 py-2 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/40"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={quadrantInputs[q.id]}
                    onChange={(e) =>
                      setQuadrantInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={`+ Add to ${q.title}...`}
                    className="flex-1 text-xs bg-transparent focus:outline-none text-zinc-800 placeholder:text-zinc-400"
                  />
                </form>

                {/* Quadrant Task List */}
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-80">
                  {qTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${
                          selectedTaskId === task.id
                            ? 'bg-zinc-900/[0.04] border-zinc-300'
                            : 'bg-white hover:bg-zinc-50/80 border-zinc-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskStatus(task.id);
                            }}
                            className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'border-zinc-300 hover:border-zinc-900'
                            }`}
                          >
                            {isDone && <Check className="w-2.5 h-2.5 stroke-[2.75] animate-check" />}
                          </button>
                          <span
                            className={`truncate font-medium ${
                              isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            aria-label="Move to quadrant"
                            value={q.id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateTask(task.id, {
                                eisenhowerQuadrant: e.target.value as 'q1' | 'q2' | 'q3' | 'q4',
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-mono-num bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80 text-zinc-700"
                          >
                            <option value="q1">Q1</option>
                            <option value="q2">Q2</option>
                            <option value="q3">Q3</option>
                            <option value="q4">Q4</option>
                          </select>
                          {task.dueDate && (
                            <span className="text-[10px] font-mono-num text-zinc-400">
                              {task.dueDate.slice(5)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <TaskDetailPane />
    </div>
  );
};

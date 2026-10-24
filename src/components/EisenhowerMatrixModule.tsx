import React, { useState } from 'react';
import { format, parseISO, startOfToday } from 'date-fns';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Flag,
  Grid2X2,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority, Task } from '../types';

export const EisenhowerMatrixModule: React.FC = () => {
  const {
    tasks,
    lists,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTaskComment,
  } = useApp();

  const [quadrantInputs, setQuadrantInputs] = useState<Record<'q1' | 'q2' | 'q3' | 'q4', string>>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  });

  const [showQuickAddFor, setShowQuickAddFor] = useState<Record<'q1' | 'q2' | 'q3' | 'q4', boolean>>({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
  });

  const [collapsedCompleted, setCollapsedCompleted] = useState<
    Record<'q1' | 'q2' | 'q3' | 'q4', boolean>
  >({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
  });

  // Popover state inside the floating task inspector card (opens only when a task in a quadrant is clicked)
  const [matrixPopoverTaskId, setMatrixPopoverTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showPopoverSubtaskCompleted, setShowPopoverSubtaskCompleted] = useState(true);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showPopoverMoreMenu, setShowPopoverMoreMenu] = useState(false);

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

  const matrixTasks = tasks.filter(
    (t) => t.status !== 'trash' && t.status !== 'wont_do' && !t.isNote
  );

  const selectedTask = tasks.find((t) => t.id === matrixPopoverTaskId) || null;

  const quadrants: {
    id: 'q1' | 'q2' | 'q3' | 'q4';
    roman: string;
    title: string;
    badgeBg: string;
    titleColor: string;
    defaultPriority: Priority;
    defaultDue?: string;
  }[] = [
    {
      id: 'q1',
      roman: 'I',
      title: 'Urgent & Important',
      badgeBg: 'bg-rose-500 text-white',
      titleColor: 'text-rose-500',
      defaultPriority: 5,
      defaultDue: todayStr,
    },
    {
      id: 'q2',
      roman: 'II',
      title: 'Not Urgent & Important',
      badgeBg: 'bg-amber-400 text-white',
      titleColor: 'text-amber-500',
      defaultPriority: 3,
    },
    {
      id: 'q3',
      roman: 'III',
      title: 'Urgent & Unimportant',
      badgeBg: 'bg-blue-500 text-white',
      titleColor: 'text-blue-500',
      defaultPriority: 1,
      defaultDue: todayStr,
    },
    {
      id: 'q4',
      roman: 'IV',
      title: 'Not Urgent & Unimportant',
      badgeBg: 'bg-emerald-500 text-white',
      titleColor: 'text-emerald-500',
      defaultPriority: 0,
    },
  ];

  const renderQuadrantTaskRow = (task: Task, qId: 'q1' | 'q2' | 'q3' | 'q4') => {
    const isDone = task.status === 'completed';
    const isSelected = matrixPopoverTaskId === task.id || selectedTaskId === task.id;
    const taskList = lists.find((l) => l.id === task.listId);

    return (
      <div
        key={task.id}
        onClick={() => {
          setSelectedTaskId(task.id);
          setMatrixPopoverTaskId(task.id);
          setShowPopoverMoreMenu(false);
        }}
        className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50/90 text-zinc-900'
            : 'hover:bg-zinc-100/80 text-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label={`Mark "${task.title}" as ${isDone ? 'incomplete' : 'completed'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskStatus(task.id);
            }}
            className={`w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 ${
              isDone
                ? 'bg-zinc-400 border-zinc-400 text-white'
                : task.priority === 5
                  ? 'border-rose-500'
                  : task.priority === 3
                    ? 'border-amber-500'
                    : task.priority === 1
                      ? 'border-blue-500'
                      : 'border-zinc-300 hover:border-zinc-600'
            }`}
          >
            {isDone && <Check className="w-2.5 h-2.5 stroke-[2.75] animate-check" />}
          </button>

          <span
            className={`truncate font-medium ${
              isDone ? 'text-zinc-400' : 'text-zinc-900'
            }`}
          >
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            aria-label="Move to quadrant"
            value={qId}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              updateTask(task.id, {
                eisenhowerQuadrant: e.target.value as 'q1' | 'q2' | 'q3' | 'q4',
              })
            }
            className="opacity-0 group-hover:opacity-100 text-[10px] font-mono-num bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200/80 text-zinc-600"
          >
            <option value="q1">Q1</option>
            <option value="q2">Q2</option>
            <option value="q3">Q3</option>
            <option value="q4">Q4</option>
          </select>

          {taskList && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              {taskList.emoji && <span>{taskList.emoji}</span>}
              <span className="truncate max-w-[72px]">{taskList.name}</span>
            </span>
          )}

          {task.dueDate && !isDone && (
            <span
              className={`text-[11px] font-mono-num ${
                task.dueDate === todayStr ? 'text-blue-600 font-medium' : 'text-zinc-400'
              }`}
            >
              {task.dueDate === todayStr
                ? 'Today'
                : format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex-1 flex h-full min-w-0 bg-zinc-50/70 overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 p-4 sm:p-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h1 className="text-base font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
            <Grid2X2 className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
            Eisenhower Matrix
          </h1>
        </div>

        {/* 2x2 Quadrants Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 min-h-[540px]">
          {quadrants.map((q) => {
            const qAllTasks = matrixTasks.filter((t) => resolveTaskQuadrant(t) === q.id);
            const qActiveTasks = qAllTasks.filter((t) => t.status !== 'completed');
            const qCompletedTasks = qAllTasks.filter((t) => t.status === 'completed');
            const isCompCollapsed = collapsedCompleted[q.id];

            return (
              <section
                key={q.id}
                className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col overflow-hidden"
              >
                {/* Quadrant Header */}
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${q.badgeBg}`}
                    >
                      {q.roman}
                    </span>
                    <h2 className={`text-xs font-semibold ${q.titleColor}`}>{q.title}</h2>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() =>
                        setShowQuickAddFor((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      title={`Add task to ${q.title}`}
                      className="p-1 rounded hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedCompleted((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      title="Toggle completed visibility"
                      className="p-1 rounded hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
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
                  className={`px-3 py-1.5 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50 ${
                    showQuickAddFor[q.id] ? 'ring-1 ring-blue-500/20 bg-blue-50/20' : ''
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
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

                {/* Quadrant Body: Active Tasks + Collapsible Completed Section */}
                <div className="flex-1 p-2.5 space-y-1 overflow-y-auto">
                  {qActiveTasks.length === 0 && qCompletedTasks.length === 0 ? (
                    <div className="h-full min-h-[140px] flex items-center justify-center text-xs text-zinc-300 select-none">
                      No Tasks
                    </div>
                  ) : (
                    <>
                      {/* Active Tasks */}
                      <div className="space-y-0.5">
                        {qActiveTasks.map((task) => renderQuadrantTaskRow(task, q.id))}
                      </div>

                      {/* Dedicated Collapsible Completed Section (NO line-through) */}
                      {qCompletedTasks.length > 0 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedCompleted((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-700 px-1.5 py-1"
                          >
                            {isCompCollapsed ? (
                              <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
                            ) : (
                              <ChevronDown className="w-3 h-3" strokeWidth={1.75} />
                            )}
                            <span>Completed</span>
                            <span className="font-mono-num">{qCompletedTasks.length}</span>
                          </button>

                          {!isCompCollapsed && (
                            <div className="space-y-0.5">
                              {qCompletedTasks.map((task) =>
                                renderQuadrantTaskRow(task, q.id)
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Floating Task Detail Popover Card on Click (matching Screenshot 4) */}
      {selectedTask && (
        <div
          onClick={() => setMatrixPopoverTaskId(null)}
          className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-[1px] flex items-center justify-center p-4 animate-backdrop"
        >
          <div
            role="dialog"
            aria-label="Floating Task Inspector"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-2xl bg-white border border-zinc-200/90 shadow-2xl flex flex-col max-h-[82vh] overflow-hidden animate-popover"
          >
            {/* Popover Top Header Bar: Checkbox | Date Picker | Priority Flag */}
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Toggle task completion"
                  onClick={() => toggleTaskStatus(selectedTask.id)}
                  className={`w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center ${
                    selectedTask.status === 'completed'
                      ? 'bg-zinc-400 border-zinc-400 text-white'
                      : selectedTask.priority === 5
                        ? 'border-rose-500'
                        : selectedTask.priority === 3
                          ? 'border-amber-500'
                          : selectedTask.priority === 1
                            ? 'border-blue-500'
                            : 'border-zinc-300'
                  }`}
                >
                  {selectedTask.status === 'completed' && (
                    <Check className="w-2.5 h-2.5 stroke-[2.75]" />
                  )}
                </button>

                <span className="h-3.5 w-[1px] bg-zinc-200" />

                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <input
                    type="date"
                    value={selectedTask.dueDate || todayStr}
                    onChange={(e) =>
                      updateTask(selectedTask.id, { dueDate: e.target.value })
                    }
                    className="bg-transparent text-xs font-medium text-blue-600 focus:outline-none cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center gap-0.5">
                {([5, 3, 1, 0] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTask(selectedTask.id, { priority: p })}
                    title={`Priority ${p}`}
                    className={`p-1 rounded-md ${
                      selectedTask.priority === p
                        ? 'bg-zinc-100'
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <Flag
                      strokeWidth={1.75}
                      className={`w-3.5 h-3.5 ${
                        p === 5
                          ? 'text-rose-500 fill-rose-500'
                          : p === 3
                            ? 'text-amber-500 fill-amber-500'
                            : p === 1
                              ? 'text-blue-500 fill-blue-500'
                              : 'text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMatrixPopoverTaskId(null)}
                  aria-label="Close task popover"
                  className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 ml-1"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Popover Body: Editable Title, Rich Markdown Notes, Visual Preview Card & Subtasks */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                className={`w-full text-base font-bold focus:outline-none ${
                  selectedTask.status === 'completed' ? 'text-zinc-400' : 'text-zinc-900'
                }`}
              />

              <textarea
                rows={3}
                value={selectedTask.content}
                onChange={(e) => updateTask(selectedTask.id, { content: e.target.value })}
                placeholder="Tap here to add content, or even use markdown..."
                className="w-full text-xs text-zinc-600 leading-relaxed bg-transparent focus:outline-none resize-none"
              />

              {/* Visual Feature Preview Card (matching Screenshot 4) */}
              <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Smart Task Card
                  </span>
                  <span className="font-mono-num text-[10px] text-blue-500">
                    {selectedTask.subtasks.filter((s) => s.completed).length}/
                    {selectedTask.subtasks.length} steps
                  </span>
                </div>

                {/* Subtasks inside Popover (split into active + Completed section, no strikethrough) */}
                <div className="space-y-1">
                  {selectedTask.subtasks
                    .filter((s) => !s.completed)
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-blue-100/80 text-xs"
                      >
                        <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => toggleSubtask(selectedTask.id, sub.id)}
                            className="rounded text-blue-600"
                          />
                          <span className="text-zinc-800 truncate">{sub.title}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteSubtask(selectedTask.id, sub.id)}
                          className="text-zinc-300 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                  {selectedTask.subtasks.some((s) => s.completed) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPopoverSubtaskCompleted((v) => !v)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-blue-600/80 mb-1"
                      >
                        {showPopoverSubtaskCompleted ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        Completed {selectedTask.subtasks.filter((s) => s.completed).length}
                      </button>
                      {showPopoverSubtaskCompleted &&
                        selectedTask.subtasks
                          .filter((s) => s.completed)
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-white/70 text-xs mb-1"
                            >
                              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => toggleSubtask(selectedTask.id, sub.id)}
                                  className="rounded text-zinc-400"
                                />
                                <span className="text-zinc-400 truncate">{sub.title}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => deleteSubtask(selectedTask.id, sub.id)}
                                className="text-zinc-300 hover:text-rose-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newSubtaskTitle.trim()) {
                        addSubtask(selectedTask.id, newSubtaskTitle);
                        setNewSubtaskTitle('');
                      }
                    }}
                    className="flex items-center gap-1.5 pt-1"
                  >
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="+ Add checklist step..."
                      className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200/70 text-xs focus:outline-none"
                    />
                  </form>
                </div>
              </div>

              {/* Optional Comment Box when MessageSquare is clicked */}
              {showCommentBox && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  {selectedTask.comments.map((c) => (
                    <div key={c.id} className="text-xs bg-zinc-50 p-2 rounded-lg">
                      <span className="font-semibold text-zinc-800">{c.author}: </span>
                      <span className="text-zinc-600">{c.text}</span>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCommentText.trim()) {
                        addTaskComment(selectedTask.id, newCommentText);
                        setNewCommentText('');
                      }
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-200"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-medium"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Popover Bottom Bar: Source List Pill on Left + Action Icons on Right (matching Screenshot 4) */}
            <div className="relative px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Task List"
                  value={selectedTask.listId}
                  onChange={(e) =>
                    updateTask(selectedTask.id, { listId: e.target.value })
                  }
                  className="text-xs font-medium text-zinc-600 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 focus:outline-none cursor-pointer"
                >
                  <option value="inbox">📥 Inbox</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.emoji ? `${l.emoji} ` : ''}
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={() =>
                    updateTask(selectedTask.id, {
                      content: selectedTask.content
                        ? `${selectedTask.content}\n- `
                        : '- ',
                    })
                  }
                  title="Insert Markdown Bullet"
                  className="p-1.5 rounded-lg hover:bg-zinc-200/60 hover:text-zinc-700"
                >
                  <Type className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentBox((v) => !v)}
                  title="Comments"
                  className="p-1.5 rounded-lg hover:bg-zinc-200/60 hover:text-zinc-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPopoverMoreMenu((v) => !v)}
                  title="More task actions"
                  className="p-1.5 rounded-lg hover:bg-zinc-200/60 hover:text-zinc-700"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>

              {showPopoverMoreMenu && (
                <div className="absolute right-4 bottom-11 z-30 w-40 rounded-xl bg-zinc-900 text-zinc-100 shadow-xl border border-zinc-800 py-1.5 text-xs animate-popover">
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(selectedTask.id, { isPinned: !selectedTask.isPinned });
                      setShowPopoverMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left"
                  >
                    <Pin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{selectedTask.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      duplicateTask(selectedTask.id);
                      setShowPopoverMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTask(selectedTask.id);
                      setMatrixPopoverTaskId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

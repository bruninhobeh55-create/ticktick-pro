import React, { useState } from 'react';
import {
  Activity,
  Bell,
  BellRing,
  BookmarkPlus,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Flag,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Play,
  Plus,
  Repeat,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority } from '../types';

export const TaskDetailPane: React.FC = () => {
  const {
    tasks,
    lists,
    tags,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTaskComment,
    addTaskAttachment,
    saveTaskAsTemplate,
    setActiveModule,
    setActivePomoTaskId,
    setPomoRunning,
    rightPaneWidth,
    setRightPaneWidth,
    triggerTaskReminderNow,
    requestNotificationPermission,
    notificationPermission,
  } = useApp();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'comments' | 'activity'>('comments');
  const [templateSavedBanner, setTemplateSavedBanner] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSubtasksCompletedCollapsed, setIsSubtasksCompletedCollapsed] = useState(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = rightPaneWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setRightPaneWidth(startWidth + delta);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const task = tasks.find((t) => t.id === selectedTaskId);

  if (!task) {
    return (
      <aside
        style={{ '--right-pane-width': `${rightPaneWidth}px` } as React.CSSProperties}
        className="hidden xl:flex lg:w-[var(--right-pane-width)] relative shrink-0 border-l border-zinc-200/80 bg-zinc-50/40 flex-col items-center justify-center p-6 text-center select-none"
      >
        <div
          onMouseDown={handleMouseDownResize}
          title="Drag to resize right inspector"
          aria-label="Resize Right Inspector"
          className="hidden lg:flex absolute inset-y-0 -left-1 w-2.5 cursor-col-resize items-center justify-center group z-20"
        >
          <div
            className={`w-[2px] h-10 rounded-full transition-colors ${
              isResizing ? 'bg-blue-600' : 'bg-transparent group-hover:bg-zinc-400'
            }`}
          />
        </div>
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-400 flex items-center justify-center mb-3">
          <FileText className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <p className="text-xs font-semibold text-zinc-600">Select any task to inspect details</p>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Configure subtasks, Markdown notes, task duration, constant reminders, attachments, and activity logs.
        </p>
      </aside>
    );
  }

  const isDone = task.status === 'completed';

  const handleStartPomodoroForTask = () => {
    setActivePomoTaskId(task.id);
    setPomoRunning(true);
    setActiveModule('pomodoro');
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop (<1024px) */}
      <div
        onClick={() => setSelectedTaskId(null)}
        className="lg:hidden fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] animate-backdrop"
      />

      <aside
        aria-label="Task Detail Inspector"
        style={{ '--right-pane-width': `${rightPaneWidth}px` } as React.CSSProperties}
        className="fixed inset-x-0 bottom-0 top-10 z-50 rounded-t-2xl shadow-2xl lg:shadow-none lg:rounded-none lg:static lg:z-10 lg:w-[var(--right-pane-width)] relative shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200/80 bg-white flex flex-col lg:h-full overflow-hidden animate-sheet-up lg:[animation:none]"
      >
        {/* PC Left-Edge Drag Resize Handle */}
        <div
          onMouseDown={handleMouseDownResize}
          title="Drag to resize right inspector (280px – 680px)"
          aria-label="Resize Right Inspector"
          className="hidden lg:flex absolute inset-y-0 left-0 w-2 cursor-col-resize items-center justify-center group z-20 hover:bg-blue-500/10"
        >
          <div
            className={`w-[2px] h-10 rounded-full transition-colors ${
              isResizing ? 'bg-blue-600' : 'bg-zinc-200/80 group-hover:bg-blue-600'
            }`}
          />
        </div>
        {/* Mobile Vaul Drag Handle */}
        <div
          onClick={() => setSelectedTaskId(null)}
          className="lg:hidden flex justify-center pt-2.5 pb-1 cursor-pointer shrink-0"
        >
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* Top Bar: Checkbox, Date, Priority, Actions */}
        <div className="h-12 lg:h-13 px-4 border-b border-zinc-200/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => toggleTaskStatus(task.id)}
              aria-label="Toggle task completion"
              className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center ${
                isDone
                  ? 'bg-zinc-900 border-zinc-900 text-white'
                  : task.priority === 5
                    ? 'border-rose-500 text-rose-500'
                    : task.priority === 3
                      ? 'border-amber-500 text-amber-500'
                      : task.priority === 1
                        ? 'border-blue-500 text-blue-500'
                        : 'border-zinc-300 text-zinc-400'
              }`}
            >
              {isDone && <Check className="w-2.5 h-2.5 stroke-[2.75] animate-check" />}
            </button>

            {/* List Selector */}
            <select
              aria-label="Task List"
              value={task.listId}
              onChange={(e) => updateTask(task.id, { listId: e.target.value }, 'Moved to another list')}
              className="text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200/70 focus:outline-none max-w-[140px] sm:max-w-none truncate"
            >
              <option value="inbox">Inbox</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Quick Action Icons */}
          <div className="flex items-center gap-0.5">
            {([5, 3, 1, 0] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => updateTask(task.id, { priority: p }, `Changed priority to P${p}`)}
                title={`Priority ${p}`}
                className={`p-1.5 rounded-md ${
                  task.priority === p ? 'bg-zinc-100 font-semibold' : 'opacity-45 hover:opacity-100'
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
              onClick={() => setSelectedTaskId(null)}
              title="Close Detail Pane"
              aria-label="Close Detail Pane"
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 ml-1"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable Inspector Body with mobile safe-area */}
        <div className="flex-1 overflow-y-auto p-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] space-y-5">
          {/* Title & Focus Pomo Button */}
          <div className="space-y-2.5">
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className={`w-full text-sm font-semibold focus:outline-none tracking-tight ${
                isDone ? 'text-zinc-400' : 'text-zinc-900'
              }`}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleStartPomodoroForTask}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-900 text-white hover:bg-zinc-800 font-mono-num"
              >
                <Play className="w-3 h-3 fill-current" />
                Focus ({task.completedPomos}/{task.estimatedPomos} Pomo)
              </button>

              <button
                onClick={() =>
                  updateTask(
                    task.id,
                    { isNote: !task.isNote },
                    task.isNote ? 'Converted Note to Task' : 'Converted Task to Note'
                  )
                }
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70"
              >
                <FileText className="w-3 h-3" strokeWidth={1.75} />
                {task.isNote ? 'Switch to Task' : 'Convert to Note'}
              </button>

              <button
                onClick={() => {
                  saveTaskAsTemplate(task.id);
                  setTemplateSavedBanner(true);
                  setTimeout(() => setTemplateSavedBanner(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70"
              >
                <BookmarkPlus className="w-3 h-3" strokeWidth={1.75} />
                {templateSavedBanner ? 'Saved Template' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Schedule, Duration & Recurrence Grid (Premium) */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/80 text-xs">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <Calendar className="w-3 h-3" strokeWidth={1.75} /> Start Date
              </label>
              <input
                type="date"
                value={task.startDate || ''}
                onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs font-mono-num"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <Calendar className="w-3 h-3" strokeWidth={1.75} /> Due Date
              </label>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs font-mono-num"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <Clock className="w-3 h-3" strokeWidth={1.75} /> Start Time
              </label>
              <input
                type="time"
                value={task.startTime || ''}
                onChange={(e) =>
                  updateTask(task.id, {
                    startTime: e.target.value,
                    isAllDay: !e.target.value,
                  })
                }
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs font-mono-num"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <Clock className="w-3 h-3" strokeWidth={1.75} /> Duration (Mins)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={task.durationMinutes || ''}
                placeholder="e.g. 60"
                onChange={(e) =>
                  updateTask(task.id, {
                    durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs font-mono-num"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <Repeat className="w-3 h-3" strokeWidth={1.75} /> Repeat Rule
              </label>
              <select
                value={task.recurrenceRule || ''}
                onChange={(e) =>
                  updateTask(task.id, { recurrenceRule: e.target.value || undefined })
                }
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs"
              >
                <option value="">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every Weekday (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                <User className="w-3 h-3" strokeWidth={1.75} /> Assignee
              </label>
              <input
                type="text"
                value={task.assignee || ''}
                placeholder="Assign member..."
                onChange={(e) => updateTask(task.id, { assignee: e.target.value || undefined })}
                className="w-full px-2 py-1 rounded-md border border-zinc-200/90 bg-white text-xs"
              />
            </div>
          </div>

          {/* Premium Reminders Block (Configurable Offsets, Constant Alert, Test & OS Permissions) */}
          <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5 font-mono-num">
                <Bell className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.75} />
                Reminders ({task.reminders.length}/5 Alerts)
              </span>

              <button
                type="button"
                onClick={() => triggerTaskReminderNow(task.id)}
                title="Test Reminder Alert Sound & Popup immediately"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 hover:bg-amber-200/80 text-amber-800 border border-amber-300/80 transition-colors"
              >
                <BellRing className="w-3 h-3 text-amber-600" />
                Test Alert
              </button>
            </div>

            {/* Reminder Offset Chips (TickTick Standard) */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-zinc-400 font-medium">Select alert times:</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'On time',
                    '5m before',
                    '15m before',
                    '30m before',
                    '1h before',
                    '1d before',
                  ] as const
                ).map((offset) => {
                  const isSelected = task.reminders.includes(offset);
                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => {
                        let next: string[];
                        if (isSelected) {
                          next = task.reminders.filter((r) => r !== offset);
                        } else {
                          if (task.reminders.length >= 5) return;
                          next = [...task.reminders, offset];
                        }
                        updateTask(task.id, { reminders: next }, `Updated reminders to ${next.join(', ') || 'None'}`);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {isSelected ? `✓ ${offset}` : `+ ${offset}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Permission Banner if not enabled */}
            {notificationPermission !== 'granted' && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 border border-blue-200/70 text-[11px]">
                <span className="text-blue-800 font-medium">Enable OS desktop/mobile alerts</span>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px]"
                >
                  Enable Alerts
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200/60">
              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 bg-white px-2.5 py-1 rounded-md border border-zinc-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.constantReminder}
                  onChange={(e) =>
                    updateTask(
                      task.id,
                      { constantReminder: e.target.checked },
                      e.target.checked ? 'Enabled Constant Reminder' : 'Disabled Constant Reminder'
                    )
                  }
                  className="rounded text-zinc-900"
                />
                <BellRing className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
                <span>Constant Reminder (Repeats chime)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 bg-white px-2.5 py-1 rounded-md border border-zinc-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.emailReminder}
                  onChange={(e) => updateTask(task.id, { emailReminder: e.target.checked })}
                  className="rounded text-zinc-900"
                />
                <Mail className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                <span>Email Alert</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
              <input
                type="text"
                value={task.locationReminder || ''}
                onChange={(e) =>
                  updateTask(task.id, { locationReminder: e.target.value || undefined })
                }
                placeholder="Location reminder (e.g. Office HQ, Supermarket)..."
                className="w-full text-xs bg-white px-2.5 py-1 rounded-md border border-zinc-200/80 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          {/* Subtasks / Checklists */}
          {!task.isNote && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-num">
                  Subtasks & Checklist ({task.subtasks.filter((s) => s.completed).length}/
                  {task.subtasks.length})
                </span>
              </div>

              <div className="space-y-1">
                {task.subtasks
                  .filter((sub) => !sub.completed)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/50"
                    >
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleSubtask(task.id, sub.id)}
                          className="rounded text-zinc-900"
                        />
                        <span className="text-xs truncate text-zinc-800">{sub.title}</span>
                      </label>
                      <button
                        onClick={() => deleteSubtask(task.id, sub.id)}
                        className="opacity-100 lg:opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}

                {task.subtasks.some((sub) => sub.completed) && (
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSubtasksCompletedCollapsed((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 mb-1 px-1"
                    >
                      {isSubtasksCompletedCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span>
                        Completed {task.subtasks.filter((sub) => sub.completed).length}
                      </span>
                    </button>
                    {!isSubtasksCompletedCollapsed && (
                      <div className="space-y-1">
                        {task.subtasks
                          .filter((sub) => sub.completed)
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200/40"
                            >
                              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => toggleSubtask(task.id, sub.id)}
                                  className="rounded text-zinc-400"
                                />
                                <span className="text-xs truncate text-zinc-400">
                                  {sub.title}
                                </span>
                              </label>
                              <button
                                onClick={() => deleteSubtask(task.id, sub.id)}
                                className="opacity-100 lg:opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newSubtaskTitle.trim()) {
                    addSubtask(task.id, newSubtaskTitle);
                    setNewSubtaskTitle('');
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="+ Add checklist item (up to 199 in Premium)..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200/90 focus:outline-none focus:border-zinc-900"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                >
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Markdown Description / Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Description & Markdown Notes
            </label>
            <textarea
              rows={5}
              value={task.content}
              onChange={(e) => updateTask(task.id, { content: e.target.value })}
              placeholder="Write markdown notes, links, or code snippets..."
              className="w-full p-3 rounded-xl border border-zinc-200/90 text-xs text-zinc-700 font-mono leading-relaxed focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tg) => {
                const hasTag = task.tags.includes(tg.name);
                return (
                  <button
                    key={tg.id}
                    type="button"
                    onClick={() => {
                      const next = hasTag
                        ? task.tags.filter((t) => t !== tg.name)
                        : [...task.tags, tg.name];
                      updateTask(task.id, { tags: next });
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                      hasTag
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5" strokeWidth={1.75} />
                    {tg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-num">
                Attachments ({task.attachments.length}/199 per day)
              </span>
              <button
                type="button"
                onClick={() => setShowAttachForm((v) => !v)}
                className="text-xs text-zinc-700 font-medium hover:text-zinc-900 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" strokeWidth={1.75} /> Attach
              </button>
            </div>

            {showAttachForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newAttachmentName.trim()) {
                    addTaskAttachment(task.id, newAttachmentName, newAttachmentUrl);
                    setNewAttachmentName('');
                    setNewAttachmentUrl('');
                    setShowAttachForm(false);
                  }
                }}
                className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 animate-popover"
              >
                <input
                  type="text"
                  required
                  value={newAttachmentName}
                  onChange={(e) => setNewAttachmentName(e.target.value)}
                  placeholder="File or resource name..."
                  className="w-full px-2 py-1 text-xs rounded-md border border-zinc-200 bg-white"
                />
                <input
                  type="url"
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  placeholder="https://... (optional link)"
                  className="w-full px-2 py-1 text-xs rounded-md border border-zinc-200 bg-white"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-md bg-zinc-900 text-white text-xs font-semibold"
                >
                  Add Attachment
                </button>
              </form>
            )}

            {task.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg border border-zinc-200/80 hover:bg-zinc-50 text-xs"
              >
                <span className="flex items-center gap-2 truncate font-medium text-zinc-700">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={1.75} />
                  {att.name}
                </span>
                <span className="text-[10px] font-mono-num text-zinc-400">{att.size}</span>
              </a>
            ))}
          </div>

          {/* Comments & Activity Log Tabs (Premium Activity History) */}
          <div className="pt-2 border-t border-zinc-200/80">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setActiveBottomTab('comments')}
                className={`text-xs font-semibold flex items-center gap-1.5 pb-1 border-b-2 font-mono-num ${
                  activeBottomTab === 'comments'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                Comments ({task.comments.length})
              </button>
              <button
                onClick={() => setActiveBottomTab('activity')}
                className={`text-xs font-semibold flex items-center gap-1.5 pb-1 border-b-2 font-mono-num ${
                  activeBottomTab === 'activity'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                Activity Log ({task.activities.length})
              </button>
            </div>

            {activeBottomTab === 'comments' ? (
              <div className="space-y-2.5">
                {task.comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800">{c.author}</span>
                      <span className="text-[10px] font-mono-num text-zinc-400">{c.createdAt}</span>
                    </div>
                    <p className="text-zinc-600">{c.text}</p>
                  </div>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newCommentText.trim()) {
                      addTaskComment(task.id, newCommentText);
                      setNewCommentText('');
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200/90 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {task.activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-2 text-[11px] text-zinc-600 py-1 border-b border-zinc-100"
                  >
                    <span>
                      <strong className="text-zinc-800">{act.actor}</strong>: {act.action}
                    </span>
                    <span className="text-[10px] font-mono-num text-zinc-400 shrink-0">
                      {act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Duplicate & Trash */}
        <div className="h-11 px-4 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-400 shrink-0 font-mono-num bg-white">
          <span>Updated {task.updatedAt}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => duplicateTask(task.id)}
              title="Duplicate Task"
              className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              title="Move to Trash"
              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

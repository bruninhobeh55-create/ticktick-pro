import React, { useState } from 'react';
import { format, addDays, isBefore, parseISO, startOfToday } from 'date-fns';
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  FolderPlus,
  Hash,
  Inbox,
  Layers,
  Plus,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ActiveSidebarSelection, useApp } from '../context/AppContext';
import { Priority, SmartListId, ViewMode } from '../types';

export const TaskSidebar: React.FC = () => {
  const {
    sidebarSelection,
    setSidebarSelection,
    tasks,
    lists,
    folders,
    tags,
    customFilters,
    addList,
    addFolder,
    toggleFolderCollapse,
    addTag,
    addCustomFilter,
    deleteCustomFilter,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useApp();

  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b66f5');
  const [newListFolderId, setNewListFolderId] = useState<string>('');
  const [newListViewMode, setNewListViewMode] = useState<ViewMode>('list');

  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [showNewFilterModal, setShowNewFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'any' | 'today' | 'overdue' | 'next7days'>('any');

  if (isSidebarCollapsed) return null;

  const handleSelectAndCloseOnMobile = (sel: ActiveSidebarSelection) => {
    setSidebarSelection(sel);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const next7Str = format(addDays(today, 7), 'yyyy-MM-dd');

  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'trash' && t.status !== 'wont_do'
  );

  const counts = {
    all: activeTasks.length,
    today: activeTasks.filter(
      (t) => t.dueDate && (t.dueDate === todayStr || isBefore(parseISO(t.dueDate), today))
    ).length,
    tomorrow: activeTasks.filter((t) => t.dueDate === tomorrowStr).length,
    next7days: activeTasks.filter((t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= next7Str)
      .length,
    inbox: activeTasks.filter((t) => t.listId === 'inbox').length,
    assigned: activeTasks.filter((t) => Boolean(t.assignee)).length,
  };

  const smartItems: { id: SmartListId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'All Tasks', icon: <Layers className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />, count: counts.all },
    { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4 text-blue-600" strokeWidth={1.75} />, count: counts.today },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      icon: <CalendarClock className="w-4 h-4 text-amber-600" strokeWidth={1.75} />,
      count: counts.tomorrow,
    },
    {
      id: 'next7days',
      label: 'Next 7 Days',
      icon: <CalendarDays className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
      count: counts.next7days,
    },
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 text-sky-600" strokeWidth={1.75} />, count: counts.inbox },
    {
      id: 'assigned',
      label: 'Assigned to Me',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />,
      count: counts.assigned,
    },
    {
      id: 'summary',
      label: 'Smart Summary',
      icon: <FileText className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />,
    },
  ];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const created = addList(
      newListName,
      newListColor,
      newListFolderId || undefined,
      newListViewMode
    );
    handleSelectAndCloseOnMobile({ kind: 'list', id: created.id });
    setNewListName('');
    setShowNewListModal(false);
  };

  const handleCreateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) return;
    addCustomFilter({
      name: filterName.trim(),
      color: '#3b66f5',
      criteria: {
        priorities: filterPriority === 'all' ? [] : [filterPriority],
        tags: [],
        listIds: [],
        dateRange: filterDateRange,
        status: 'todo',
      },
    });
    setFilterName('');
    setShowNewFilterModal(false);
  };

  const ungroupedLists = lists.filter((l) => !l.folderId);

  return (
    <>
      {/* Mobile Slide-Over Backdrop (<768px) */}
      <div
        onClick={() => setIsSidebarCollapsed(true)}
        className="md:hidden fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-[2px] animate-backdrop"
      />

      <aside
        aria-label="Lists, Tags, and Filters"
        className="fixed inset-y-0 left-0 z-40 w-[276px] max-w-[84vw] pb-16 md:pb-0 md:static md:z-auto md:w-60 shrink-0 bg-zinc-50 border-r border-zinc-200/80 flex flex-col h-full select-none overflow-y-auto shadow-2xl md:shadow-none animate-drawer-left md:[animation:none]"
      >
        {/* Mobile Drawer Header */}
        <div className="md:hidden flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-zinc-200/70">
          <span className="text-xs font-semibold text-zinc-900 tracking-tight">
            Lists, Filters & Tags
          </span>
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            aria-label="Close Sidebar"
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Smart Lists Section */}
        <div className="p-2.5 space-y-0.5">
          {smartItems.map((item) => {
            const isSelected = sidebarSelection.kind === 'smart' && sidebarSelection.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectAndCloseOnMobile({ kind: 'smart', id: item.id })}
                className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs font-medium ${
                  isSelected
                    ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] font-mono-num ${
                      isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-zinc-200/70 mx-3 my-1" />

        {/* Folders & Custom Lists Section */}
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-num">
              Lists ({lists.length}/299)
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowNewFolderInput((v) => !v)}
                title="New Folder"
                className="p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700"
              >
                <FolderPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setShowNewListModal(true)}
                title="New List"
                className="p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {showNewFolderInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim()) {
                  addFolder(newFolderName);
                  setNewFolderName('');
                  setShowNewFolderInput(false);
                }
              }}
              className="mb-2 px-1 animate-popover"
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name + Enter..."
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
              />
            </form>
          )}

          {/* Folders */}
          <div className="space-y-1">
            {folders.map((folder) => {
              const folderLists = lists.filter((l) => l.folderId === folder.id);
              return (
                <div key={folder.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleFolderCollapse(folder.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 md:py-1 rounded-md text-xs font-semibold text-zinc-600 hover:bg-zinc-200/50"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {folder.isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                      )}
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-[10px] font-mono-num text-zinc-400">
                      {folderLists.length}
                    </span>
                  </button>

                  {!folder.isCollapsed && (
                    <div className="pl-3 space-y-0.5">
                      {folderLists.map((list) => {
                        const isSelected =
                          sidebarSelection.kind === 'list' && sidebarSelection.id === list.id;
                        const listCount = activeTasks.filter((t) => t.listId === list.id).length;
                        return (
                          <button
                            key={list.id}
                            onClick={() => handleSelectAndCloseOnMobile({ kind: 'list', id: list.id })}
                            className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs ${
                              isSelected
                                ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                                : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: list.color }}
                              />
                              <span className="truncate">{list.name}</span>
                              {list.isShared && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200/80 text-zinc-600 font-medium">
                                  Team
                                </span>
                              )}
                            </span>
                            {listCount > 0 && (
                              <span className="text-[11px] font-mono-num text-zinc-400">
                                {listCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped Lists */}
            {ungroupedLists.map((list) => {
              const isSelected = sidebarSelection.kind === 'list' && sidebarSelection.id === list.id;
              const listCount = activeTasks.filter((t) => t.listId === list.id).length;
              return (
                <button
                  key={list.id}
                  onClick={() => handleSelectAndCloseOnMobile({ kind: 'list', id: list.id })}
                  className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs ${
                    isSelected
                      ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="truncate">{list.name}</span>
                  </span>
                  {listCount > 0 && (
                    <span className="text-[11px] font-mono-num text-zinc-400">{listCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-200/70 mx-3 my-1" />

        {/* Smart Custom Filters */}
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Filters
            </span>
            <button
              onClick={() => setShowNewFilterModal(true)}
              title="Create Smart Filter"
              className="p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="space-y-0.5">
            {customFilters.map((flt) => {
              const isSelected = sidebarSelection.kind === 'filter' && sidebarSelection.id === flt.id;
              return (
                <div
                  key={flt.id}
                  className={`group flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
                  }`}
                  onClick={() => handleSelectAndCloseOnMobile({ kind: 'filter', id: flt.id })}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: flt.color }} strokeWidth={1.75} />
                    <span className="truncate">{flt.name}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomFilter(flt.id);
                    }}
                    title="Delete filter"
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3 h-3" strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-200/70 mx-3 my-1" />

        {/* Tags Section */}
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Tags
            </span>
            <button
              onClick={() => setShowNewTagInput((v) => !v)}
              title="New Tag"
              className="p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {showNewTagInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTagName.trim()) {
                  addTag(newTagName, '#3b66f5');
                  setNewTagName('');
                  setShowNewTagInput(false);
                }
              }}
              className="mb-2 px-1 animate-popover"
            >
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="#tag name + Enter..."
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
              />
            </form>
          )}

          <div className="flex flex-wrap gap-1 px-1">
            {tags.map((tag) => {
              const isSelected = sidebarSelection.kind === 'tag' && sidebarSelection.id === tag.name;
              return (
                <button
                  key={tag.id}
                  onClick={() => handleSelectAndCloseOnMobile({ kind: 'tag', id: tag.name })}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200/80 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  <Hash
                    className="w-2.5 h-2.5"
                    style={{ color: isSelected ? '#fff' : tag.color }}
                    strokeWidth={1.75}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Archive / Completed / Won't Do / Trash */}
        <div className="mt-auto p-2.5 border-t border-zinc-200/80 space-y-0.5">
          <button
            onClick={() => handleSelectAndCloseOnMobile({ kind: 'smart', id: 'completed' })}
            className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs ${
              sidebarSelection.kind === 'smart' && sidebarSelection.id === 'completed'
                ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
              Completed
            </span>
            <span className="text-[11px] font-mono-num">
              {tasks.filter((t) => t.status === 'completed').length}
            </span>
          </button>

          <button
            onClick={() => handleSelectAndCloseOnMobile({ kind: 'smart', id: 'wont_do' })}
            className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs ${
              sidebarSelection.kind === 'smart' && sidebarSelection.id === 'wont_do'
                ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
              Won't Do
            </span>
            <span className="text-[11px] font-mono-num">
              {tasks.filter((t) => t.status === 'wont_do').length}
            </span>
          </button>

          <button
            onClick={() => handleSelectAndCloseOnMobile({ kind: 'smart', id: 'trash' })}
            className={`w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs ${
              sidebarSelection.kind === 'smart' && sidebarSelection.id === 'trash'
                ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
              Trash
            </span>
            <span className="text-[11px] font-mono-num">
              {tasks.filter((t) => t.status === 'trash').length}
            </span>
          </button>
        </div>

        {/* Modal: Create New List */}
        {showNewListModal && (
          <div
            onClick={() => setShowNewListModal(false)}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop"
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateList}
              className="surface-floating rounded-t-2xl sm:rounded-xl w-full max-w-sm p-5 pb-8 sm:pb-5 space-y-4 animate-sheet-up sm:animate-modal"
            >
              <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900">Create New List</h3>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">List Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Q1 Product Roadmap"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Folder</label>
                  <select
                    value={newListFolderId}
                    onChange={(e) => setNewListFolderId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                  >
                    <option value="">None (Top level)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Default View</label>
                  <select
                    value={newListViewMode}
                    onChange={(e) => setNewListViewMode(e.target.value as ViewMode)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                  >
                    <option value="list">List View</option>
                    <option value="kanban">Kanban Board</option>
                    <option value="timeline">Timeline (Gantt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">List Color</label>
                <div className="flex items-center gap-2">
                  {['#3b66f5', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#0ea5e9'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewListColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full ${
                          newListColor === c ? 'ring-2 ring-offset-2 ring-zinc-900' : ''
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Create Smart Filter */}
        {showNewFilterModal && (
          <div
            onClick={() => setShowNewFilterModal(false)}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop"
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateFilter}
              className="surface-floating rounded-t-2xl sm:rounded-xl w-full max-w-sm p-5 pb-8 sm:pb-5 space-y-4 animate-sheet-up sm:animate-modal"
            >
              <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900">Create Smart Filter</h3>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Filter Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g. Urgent This Week"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) =>
                      setFilterPriority(
                        e.target.value === 'all' ? 'all' : (Number(e.target.value) as Priority)
                      )
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                  >
                    <option value="all">Any Priority</option>
                    <option value={5}>High Priority</option>
                    <option value={3}>Medium Priority</option>
                    <option value={1}>Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Due Date</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) =>
                      setFilterDateRange(
                        e.target.value as 'any' | 'today' | 'overdue' | 'next7days'
                      )
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
                  >
                    <option value="any">Any Date</option>
                    <option value="today">Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="next7days">Next 7 Days</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFilterModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  Save Filter
                </button>
              </div>
            </form>
          </div>
        )}
      </aside>
    </>
  );
};

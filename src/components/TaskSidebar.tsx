import React, { useState } from 'react';
import { format, addDays, isBefore, parseISO, startOfToday } from 'date-fns';
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eraser,
  FileText,
  Filter,
  FolderPlus,
  Hash,
  Inbox,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ActiveSidebarSelection, useApp } from '../context/AppContext';
import { Priority, SmartListId, TaskList, ViewMode } from '../types';

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
    updateList,
    deleteList,
    addFolder,
    updateFolder,
    deleteFolder,
    toggleFolderCollapse,
    addTag,
    updateTag,
    deleteTag,
    addCustomFilter,
    deleteCustomFilter,
    clearAllWorkspaceData,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useApp();

  // Create / Edit List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('#3b66f5');
  const [listFolderId, setListFolderId] = useState<string>('');
  const [listViewMode, setListViewMode] = useState<ViewMode>('list');

  // Create / Edit Folder State
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Create / Edit Tag State
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('#3b66f5');

  // Create Smart Filter Modal State
  const [showNewFilterModal, setShowNewFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterDateRange, setFilterDateRange] = useState<
    'any' | 'today' | 'overdue' | 'next7days'
  >('any');

  // Blank Workspace Confirmation State
  const [confirmBlankReset, setConfirmBlankReset] = useState(false);

  if (isSidebarCollapsed) return null;

  const handleSelectAndCloseOnMobile = (sel: ActiveSidebarSelection) => {
    setSidebarSelection(sel);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  const openCreateListModal = () => {
    setEditingListId(null);
    setListName('');
    setListColor('#3b66f5');
    setListFolderId('');
    setListViewMode('list');
    setShowListModal(true);
  };

  const openEditListModal = (list: TaskList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingListId(list.id);
    setListName(list.name);
    setListColor(list.color);
    setListFolderId(list.folderId || '');
    setListViewMode(list.viewMode);
    setShowListModal(true);
  };

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;
    if (editingListId) {
      updateList(editingListId, {
        name: listName.trim(),
        color: listColor,
        folderId: listFolderId || undefined,
        viewMode: listViewMode,
      });
    } else {
      const created = addList(
        listName,
        listColor,
        listFolderId || undefined,
        listViewMode
      );
      handleSelectAndCloseOnMobile({ kind: 'list', id: created.id });
    }
    setListName('');
    setEditingListId(null);
    setShowListModal(false);
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
    next7days: activeTasks.filter(
      (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= next7Str
    ).length,
    inbox: activeTasks.filter((t) => t.listId === 'inbox').length,
    assigned: activeTasks.filter((t) => Boolean(t.assignee)).length,
  };

  const smartItems: { id: SmartListId; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'all',
      label: 'All Tasks',
      icon: <Layers className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />,
      count: counts.all,
    },
    {
      id: 'today',
      label: 'Today',
      icon: <Calendar className="w-4 h-4 text-blue-600" strokeWidth={1.75} />,
      count: counts.today,
    },
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
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox className="w-4 h-4 text-sky-600" strokeWidth={1.75} />,
      count: counts.inbox,
    },
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

  const ungroupedLists = lists.filter((l) => !l.folderId);

  const renderListRow = (list: TaskList) => {
    const isSelected = sidebarSelection.kind === 'list' && sidebarSelection.id === list.id;
    const listCount = activeTasks.filter((t) => t.listId === list.id).length;

    return (
      <div
        key={list.id}
        onClick={() => handleSelectAndCloseOnMobile({ kind: 'list', id: list.id })}
        className={`group flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-lg text-xs cursor-pointer ${
          isSelected
            ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
            : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
        }`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: list.color }}
          />
          <span className="truncate">{list.name}</span>
          {list.isShared && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200/80 text-zinc-600 font-medium shrink-0">
              Team
            </span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => openEditListModal(list, e)}
              title={`Edit list "${list.name}"`}
              aria-label={`Edit list ${list.name}`}
              className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800"
            >
              <Pencil className="w-3 h-3" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteList(list.id);
              }}
              title={`Delete list "${list.name}"`}
              aria-label={`Delete list ${list.name}`}
              className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </div>
          {listCount > 0 && (
            <span className="text-[11px] font-mono-num text-zinc-400 pl-0.5">{listCount}</span>
          )}
        </div>
      </div>
    );
  };

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
                aria-label="New Folder"
                className="p-1 rounded-md hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700"
              >
                <FolderPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                onClick={openCreateListModal}
                title="New List"
                aria-label="New List"
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
              const isEditingThisFolder = editingFolderId === folder.id;

              return (
                <div key={folder.id} className="space-y-0.5">
                  {isEditingThisFolder ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingFolderName.trim()) {
                          updateFolder(folder.id, editingFolderName);
                        }
                        setEditingFolderId(null);
                      }}
                      className="flex items-center gap-1 px-1.5 py-1 bg-white rounded-lg border border-zinc-300"
                    >
                      <input
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        autoFocus
                        className="flex-1 min-w-0 text-xs text-zinc-900 focus:outline-none"
                      />
                      <button
                        type="submit"
                        title="Save folder name"
                        className="p-1 rounded bg-zinc-900 text-white"
                      >
                        <Check className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFolderId(null)}
                        title="Cancel"
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-100"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </form>
                  ) : (
                    <div
                      onClick={() => toggleFolderCollapse(folder.id)}
                      className="group flex items-center justify-between px-2 py-1.5 md:py-1 rounded-md text-xs font-semibold text-zinc-600 hover:bg-zinc-200/50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 truncate min-w-0">
                        {folder.isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
                        )}
                        <span className="truncate">{folder.name}</span>
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            title={`Rename folder "${folder.name}"`}
                            aria-label={`Rename folder ${folder.name}`}
                            className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800"
                          >
                            <Pencil className="w-3 h-3" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolder(folder.id);
                            }}
                            title={`Delete folder "${folder.name}"`}
                            aria-label={`Delete folder ${folder.name}`}
                            className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono-num text-zinc-400">
                          {folderLists.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {!folder.isCollapsed && (
                    <div className="pl-3 space-y-0.5">
                      {folderLists.map(renderListRow)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped Lists */}
            {ungroupedLists.map(renderListRow)}
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
                    className="md:opacity-0 md:group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-200/70 mx-3 my-1" />

        {/* Tags Section (with Edit & Delete) */}
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Tags ({tags.length})
            </span>
            <button
              onClick={() => setShowNewTagInput((v) => !v)}
              title="New Tag"
              aria-label="New Tag"
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

          {/* Inline Tag Edit Form */}
          {editingTagId && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTagName.trim()) {
                  updateTag(editingTagId, editingTagName, editingTagColor);
                }
                setEditingTagId(null);
              }}
              className="mb-2 p-2 rounded-lg bg-white border border-zinc-300 space-y-2 animate-popover"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Edit Tag
              </div>
              <input
                type="text"
                value={editingTagName}
                onChange={(e) => setEditingTagName(e.target.value)}
                autoFocus
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 focus:outline-none focus:border-zinc-900"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {['#2563eb', '#059669', '#d97706', '#e11d48', '#7c3aed', '#0d9488'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingTagColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-full ${
                        editingTagColor === c ? 'ring-2 ring-offset-1 ring-zinc-900' : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingTagId(null)}
                    className="px-2 py-0.5 rounded text-[10px] text-zinc-500 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {tags.map((tag) => {
              const isSelected = sidebarSelection.kind === 'tag' && sidebarSelection.id === tag.name;
              return (
                <div
                  key={tag.id}
                  onClick={() => handleSelectAndCloseOnMobile({ kind: 'tag', id: tag.name })}
                  className={`group flex items-center justify-between px-2.5 py-1.5 md:py-1 rounded-lg text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate min-w-0">
                    <Hash
                      className="w-3 h-3 shrink-0"
                      style={{ color: tag.color }}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{tag.name}</span>
                  </span>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTagId(tag.id);
                        setEditingTagName(tag.name);
                        setEditingTagColor(tag.color);
                      }}
                      title={`Edit tag #${tag.name}`}
                      aria-label={`Edit tag ${tag.name}`}
                      className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800"
                    >
                      <Pencil className="w-3 h-3" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTag(tag.id);
                      }}
                      title={`Delete tag #${tag.name}`}
                      aria-label={`Delete tag ${tag.name}`}
                      className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Archive / Completed / Won't Do / Trash & Start Blank */}
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

          {/* Start Blank / Clear All Data Button */}
          <div className="pt-2 mt-1 border-t border-zinc-200/70">
            {!confirmBlankReset ? (
              <button
                type="button"
                onClick={() => setConfirmBlankReset(true)}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/70"
              >
                <Eraser className="w-3.5 h-3.5" strokeWidth={1.75} />
                Reset to Blank Workspace
              </button>
            ) : (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5 animate-popover">
                <div className="text-[10px] font-semibold text-rose-800">
                  Clear all tasks, lists, habits & logs?
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllWorkspaceData();
                      setConfirmBlankReset(false);
                    }}
                    className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold"
                  >
                    Yes, Start Blank
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBlankReset(false)}
                    className="px-2 py-1 rounded bg-white text-zinc-600 text-[10px] font-medium border border-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create or Edit List */}
        {showListModal && (
          <div
            onClick={() => setShowListModal(false)}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop"
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveList}
              className="surface-floating rounded-t-2xl sm:rounded-xl w-full max-w-sm p-5 pb-8 sm:pb-5 space-y-4 animate-sheet-up sm:animate-modal"
            >
              <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900">
                {editingListId ? 'Edit List' : 'Create New List'}
              </h3>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">List Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. Q1 Product Roadmap"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Folder</label>
                  <select
                    value={listFolderId}
                    onChange={(e) => setListFolderId(e.target.value)}
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
                    value={listViewMode}
                    onChange={(e) => setListViewMode(e.target.value as ViewMode)}
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
                        onClick={() => setListColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full ${
                          listColor === c ? 'ring-2 ring-offset-2 ring-zinc-900' : ''
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  {editingListId ? 'Save Changes' : 'Create List'}
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

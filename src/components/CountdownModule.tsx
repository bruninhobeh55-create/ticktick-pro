import React, { useState } from 'react';
import { differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { Hourglass, Pin, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CountdownItem } from '../types';
import { COUNTDOWN_ICON_KEYS, UiIcon } from './UiIcon';

export const CountdownModule: React.FC = () => {
  const { countdowns, addCountdown, deleteCountdown, templates, applyTemplate, setActiveModule } =
    useApp();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<CountdownItem['category']>('milestone');
  const [icon, setIcon] = useState('rocket');
  const [color, setColor] = useState('#3b66f5');

  const today = startOfToday();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    addCountdown({
      title: title.trim(),
      targetDate,
      category,
      color,
      icon,
      repeatCycle: 'none',
      isPinned: false,
    });
    setTitle('');
    setTargetDate('');
    setShowModal(false);
  };

  return (
    <div className="flex-1 h-full bg-zinc-50/60 overflow-y-auto p-3.5 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Countdown Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
                <Hourglass className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
                Countdown & Day Counter ({countdowns.length}/299)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Keep track of important launches, exams, birthdays, and milestones.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} /> Add Countdown
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countdowns.map((item) => {
              const diff = differenceInCalendarDays(parseISO(item.targetDate), today);
              const isPast = diff < 0;
              const absDays = Math.abs(diff);

              return (
                <div
                  key={item.id}
                  className="relative group surface-card rounded-xl p-5 flex flex-col justify-between overflow-hidden"
                >
                  <div
                    style={{ backgroundColor: item.color }}
                    className="absolute top-0 left-0 right-0 h-1"
                  />
                  <div className="flex items-start justify-between">
                    <span
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-black/[0.04]"
                    >
                      <UiIcon name={item.icon} className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1">
                      {item.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-zinc-700 fill-zinc-700" strokeWidth={1.75} />
                      )}
                      <button
                        onClick={() => deleteCountdown(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  <div className="my-4">
                    <div className="text-3xl font-bold font-mono-num text-zinc-900 tracking-tight">
                      {absDays}{' '}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {diff === 0 ? 'Today' : isPast ? 'Days Since' : 'Days Left'}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-zinc-800 mt-1">{item.title}</h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-num text-zinc-400 pt-2.5 border-t border-zinc-100">
                    <span>{format(parseISO(item.targetDate), 'MMM d, yyyy')}</span>
                    <span className="capitalize px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-sans font-medium">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reusable Task Templates Hub */}
        <section className="space-y-4 pt-4 border-t border-zinc-200/80">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
              Reusable Task Templates Hub
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Launch complex checklists in one click or save any existing task as a custom template.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="surface-card rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                      {tpl.category}
                    </span>
                    {tpl.durationMinutes && (
                      <span className="text-[11px] font-mono-num text-zinc-400">
                        {tpl.durationMinutes}m
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{tpl.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">{tpl.content}</p>
                  <ul className="space-y-1 pt-1">
                    {tpl.subtasks.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="text-[11px] text-zinc-600 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-zinc-400" />
                        <span className="truncate">{s.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    applyTemplate(tpl.id);
                    setActiveModule('tasks');
                  }}
                  className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold font-mono-num"
                >
                  Use Template ({tpl.subtasks.length} Subtasks)
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-3.5 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">New Countdown Event</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Event Title</label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {COUNTDOWN_ICON_KEYS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIcon(item.key)}
                    title={item.label}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      icon === item.key
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <UiIcon name={item.key} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg border border-zinc-300 font-mono-num"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CountdownItem['category'])}
                className="px-2.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white"
              >
                <option value="milestone">Milestone</option>
                <option value="work">Work Launch</option>
                <option value="exam">Exam</option>
                <option value="birthday">Birthday</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div className="flex gap-2">
              {['#3b66f5', '#10b981', '#0ea5e9', '#e11d48', '#f59e0b'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full ${
                    color === c ? 'ring-2 ring-offset-2 ring-zinc-900' : ''
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Add Countdown
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

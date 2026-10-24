import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Headphones,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WHITE_NOISE_OPTIONS } from '../utils/soundEngine';
import { UiIcon } from './UiIcon';

export const PomodoroModule: React.FC = () => {
  const {
    tasks,
    preferences,
    updatePreferences,
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
    pomodoroSessions,
    logManualFocusSession,
  } = useApp();

  const [sessionNote, setSessionNote] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualMinutes, setManualMinutes] = useState(25);
  const [manualNote, setManualNote] = useState('');
  const [showPomoSettings, setShowPomoSettings] = useState(false);

  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'trash');

  const displaySeconds = pomoMode === 'pomo' ? pomoSecondsLeft : stopwatchSeconds;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  const totalPhaseSeconds =
    pomoPhase === 'work'
      ? preferences.pomoDuration * 60
      : pomoPhase === 'short_break'
        ? preferences.shortBreakDuration * 60
        : preferences.longBreakDuration * 60;

  const progressRatio =
    pomoMode === 'pomo'
      ? Math.max(0, Math.min(1, 1 - pomoSecondsLeft / Math.max(1, totalPhaseSeconds)))
      : (stopwatchSeconds % 1500) / 1500;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = pomodoroSessions.filter((s) => s.startTime.startsWith(todayStr));
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalFocusMinutes = pomodoroSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-zinc-50/70 overflow-y-auto">
      {/* Left / Center: Interactive Focus Timer & White Noise Studio */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md surface-card rounded-2xl p-4 sm:p-6 flex flex-col items-center space-y-4 sm:space-y-5">
          {/* Mode Switcher: Pomo vs Stopwatch + Timer Settings */}
          <div className="w-full flex items-center justify-between">
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70">
              <button
                onClick={() => {
                  setPomoRunning(false);
                  setPomoMode('pomo');
                }}
                className={`px-3.5 py-1 rounded-md text-xs font-semibold ${
                  pomoMode === 'pomo'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Pomodoro
              </button>
              <button
                onClick={() => {
                  setPomoRunning(false);
                  setPomoMode('stopwatch');
                }}
                className={`px-3.5 py-1 rounded-md text-xs font-semibold ${
                  pomoMode === 'stopwatch'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Stopwatch
              </button>
            </div>

            <button
              onClick={() => setShowPomoSettings((v) => !v)}
              title="Customize Pomodoro Durations"
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Settings2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Phase Pills for Pomodoro Mode */}
          {pomoMode === 'pomo' && (
            <div className="flex items-center gap-1.5 font-mono-num">
              {(
                [
                  ['work', `Focus (${preferences.pomoDuration}m)`],
                  ['short_break', `Short Break (${preferences.shortBreakDuration}m)`],
                  ['long_break', `Long Break (${preferences.longBreakDuration}m)`],
                ] as const
              ).map(([phaseId, label]) => (
                <button
                  key={phaseId}
                  onClick={() => {
                    setPomoRunning(false);
                    setPomoPhase(phaseId);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                    pomoPhase === phaseId
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Target Task Selector */}
          <div className="w-full">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-center mb-1">
              Focusing On Task
            </label>
            <select
              value={activePomoTaskId || ''}
              onChange={(e) => setActivePomoTaskId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200/90 bg-zinc-50 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="">General Deep Work Session</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.completedPomos}/{t.estimatedPomos} Pomo)
                </option>
              ))}
            </select>
          </div>

          {/* Circular Progress Dial */}
          <div className="relative w-60 h-60 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke="#f4f4f5"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke={pomoPhase === 'work' ? '#18181b' : '#10b981'}
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-bold font-mono-num tracking-tight text-zinc-900">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-xs font-medium text-zinc-400 mt-1.5">
                {pomoRunning ? 'Deep work in progress' : 'Ready to focus'}
              </span>
            </div>
          </div>

          {/* Controls: Start / Pause / Reset / Complete & Log */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPomoRunning(!pomoRunning)}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2"
            >
              {pomoRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={resetPomoTimer}
              title="Reset Timer"
              className="p-2.5 rounded-xl border border-zinc-200/90 text-zinc-600 hover:bg-zinc-100"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
            </button>

            <button
              onClick={() => {
                completeCurrentPomoSession(sessionNote);
                setSessionNote('');
              }}
              title="Finish & Log Focus Session Now"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Finish & Log
            </button>
          </div>

          {/* Premium White Noise / Ambient Sound Mixer */}
          <div className="w-full pt-4 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />
                White Noise & Ambient Sound
              </span>
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={whiteNoiseVolume}
                  onChange={(e) => setWhiteNoiseVolume(Number(e.target.value))}
                  aria-label="White noise volume"
                  className="w-20 accent-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {WHITE_NOISE_OPTIONS.map((opt) => {
                const isSelected = activeWhiteNoise === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveWhiteNoise(opt.id)}
                    className={`p-2 rounded-lg border text-left ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-900 text-white'
                        : 'bg-zinc-50/80 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <UiIcon name={opt.icon} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.name}</span>
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? 'text-zinc-300' : 'text-zinc-400'
                      }`}
                    >
                      {opt.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Focus Statistics & Record History */}
      <div className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-zinc-200/80 bg-white p-4 sm:p-6 flex flex-col space-y-5 sm:space-y-6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Focus Overview & Timeline
            </h2>
            <p className="text-xs text-zinc-400 font-mono-num mt-0.5">
              Daily Goal: {todayFocusMinutes} / {preferences.dailyFocusMinutesGoal} mins
            </p>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} /> Add Record
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="text-[11px] font-medium text-zinc-500">Today's Pomo</div>
            <div className="text-xl font-bold font-mono-num text-zinc-900 mt-1">
              {todaySessions.length}{' '}
              <span className="text-xs font-normal text-zinc-400">
                / {preferences.dailyPomoGoal}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="text-[11px] font-medium text-zinc-500">Today's Focus</div>
            <div className="text-xl font-bold font-mono-num text-blue-600 mt-1">
              {Math.floor(todayFocusMinutes / 60)}h {todayFocusMinutes % 60}m
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="text-[11px] font-medium text-zinc-500">Total Sessions</div>
            <div className="text-xl font-bold font-mono-num text-zinc-900 mt-1">
              {pomodoroSessions.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="text-[11px] font-medium text-zinc-500">Total Focus Duration</div>
            <div className="text-xl font-bold font-mono-num text-emerald-600 mt-1">
              {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
            </div>
          </div>
        </div>

        {/* Focus Timeline Log */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Focus Record Log
          </h3>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {pomodoroSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-800 truncate">
                    {sess.taskTitle}
                  </span>
                  <span className="text-xs font-mono-num font-bold text-zinc-900 shrink-0">
                    +{sess.durationMinutes}m
                  </span>
                </div>
                {sess.note && <p className="text-[11px] text-zinc-500">{sess.note}</p>}
                <div className="flex items-center justify-between text-[10px] font-mono-num text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" strokeWidth={1.75} />
                    {sess.startTime.slice(0, 10)} ({sess.mode.toUpperCase()})
                  </span>
                  {sess.whiteNoiseUsed && (
                    <span className="inline-flex items-center gap-1">
                      <Headphones className="w-3 h-3" strokeWidth={1.75} />
                      {sess.whiteNoiseUsed}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Manual Focus Record */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              logManualFocusSession(
                manualTitle || 'Deep Focus Session',
                manualMinutes,
                new Date().toISOString(),
                manualNote
              );
              setManualTitle('');
              setManualNote('');
              setShowManualModal(false);
            }}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-3 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">Add Manual Focus Record</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Task / Topic</label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="What did you focus on?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono-num focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Focus Note</label>
              <input
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Key accomplishments..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Save Focus Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Pomo Timer Settings */}
      {showPomoSettings && (
        <div
          onClick={() => setShowPomoSettings(false)}
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface-floating rounded-xl w-full max-w-sm p-5 space-y-4 animate-modal"
          >
            <h3 className="text-sm font-semibold text-zinc-900">Pomodoro Timer Settings</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Focus (m)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={preferences.pomoDuration}
                  onChange={(e) =>
                    updatePreferences({ pomoDuration: Math.max(5, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Short Break
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={preferences.shortBreakDuration}
                  onChange={(e) =>
                    updatePreferences({ shortBreakDuration: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Long Break
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={preferences.longBreakDuration}
                  onChange={(e) =>
                    updatePreferences({ longBreakDuration: Math.max(5, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 font-mono-num"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPomoSettings(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

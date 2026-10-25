import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavigationRail } from './components/NavigationRail';
import { SplashScreen } from './components/SplashScreen';
import { SonnerToaster } from './components/SonnerToaster';
import { TaskDetailPane } from './components/TaskDetailPane';
import { TaskSidebar } from './components/TaskSidebar';
import { TaskWorkspace } from './components/TaskWorkspace';
import { AppProvider, useApp } from './context/AppContext';

// Code-split secondary modules and modals for lightning-fast initial load
const CalendarModule = lazy(() =>
  import('./components/CalendarModule').then((m) => ({ default: m.CalendarModule }))
);
const PomodoroModule = lazy(() =>
  import('./components/PomodoroModule').then((m) => ({ default: m.PomodoroModule }))
);
const HabitTrackerModule = lazy(() =>
  import('./components/HabitTrackerModule').then((m) => ({ default: m.HabitTrackerModule }))
);
const EisenhowerMatrixModule = lazy(() =>
  import('./components/EisenhowerMatrixModule').then((m) => ({ default: m.EisenhowerMatrixModule }))
);
const CountdownModule = lazy(() =>
  import('./components/CountdownModule').then((m) => ({ default: m.CountdownModule }))
);
const StatisticsModule = lazy(() =>
  import('./components/StatisticsModule').then((m) => ({ default: m.StatisticsModule }))
);
const SettingsAndSupabaseModal = lazy(() =>
  import('./components/SettingsAndSupabaseModal').then((m) => ({ default: m.SettingsAndSupabaseModal }))
);
const CommandPaletteModal = lazy(() =>
  import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);
const ActiveReminderModal = lazy(() =>
  import('./components/ActiveReminderModal').then((m) => ({ default: m.ActiveReminderModal }))
);
const InstallAppModal = lazy(() =>
  import('./components/InstallAppModal').then((m) => ({ default: m.InstallAppModal }))
);

const ModuleLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/80 select-none animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-zinc-200/80 mb-3" />
    <div className="h-3 w-32 bg-zinc-200 rounded-full mb-2" />
    <div className="h-2 w-48 bg-zinc-200/60 rounded-full" />
  </div>
);

const MainShell: React.FC = () => {
  const { activeModule, setActiveModule, toasts, dismissToast, isInstallModalOpen, setIsInstallModalOpen } = useApp();

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col md:flex-row bg-zinc-50 text-zinc-900 antialiased">
      {/* Desktop Far-Left Icon Rail + Mobile Bottom Tab Bar */}
      <NavigationRail />

      {/* Center + Right Module Switcher */}
      <div className="flex-1 flex h-full min-w-0 min-h-0 overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {activeModule === 'tasks' && (
          <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
            <TaskSidebar />
            <TaskWorkspace />
            <TaskDetailPane />
          </div>
        )}

        {activeModule === 'calendar' && (
          <ErrorBoundary moduleName="Calendar" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <CalendarModule />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeModule === 'pomodoro' && (
          <ErrorBoundary moduleName="Pomodoro & Focus" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <PomodoroModule />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeModule === 'habits' && (
          <ErrorBoundary moduleName="Habit Tracker" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <HabitTrackerModule />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeModule === 'matrix' && (
          <ErrorBoundary moduleName="Eisenhower Matrix" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <EisenhowerMatrixModule />
            </Suspense>
          </ErrorBoundary>
        )}

        {(activeModule === 'countdown' || activeModule === 'templates') && (
          <ErrorBoundary moduleName="Countdown & Templates" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <CountdownModule />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeModule === 'statistics' && (
          <ErrorBoundary moduleName="Statistics & Analytics" onReset={() => setActiveModule('tasks')}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              <StatisticsModule />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      {/* Global Overlays & Modals */}
      <SplashScreen />

      <Suspense fallback={null}>
        <CommandPaletteModal />
        <SettingsAndSupabaseModal />
        <ActiveReminderModal />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </Suspense>

      <SonnerToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary moduleName="TickTick Pro">
      <AppProvider>
        <MainShell />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;

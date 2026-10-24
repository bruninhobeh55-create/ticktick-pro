import React from 'react';
import { ActiveReminderModal } from './components/ActiveReminderModal';
import { CalendarModule } from './components/CalendarModule';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { CountdownModule } from './components/CountdownModule';
import { EisenhowerMatrixModule } from './components/EisenhowerMatrixModule';
import { HabitTrackerModule } from './components/HabitTrackerModule';
import { NavigationRail } from './components/NavigationRail';
import { PomodoroModule } from './components/PomodoroModule';
import { SettingsAndSupabaseModal } from './components/SettingsAndSupabaseModal';
import { SonnerToaster } from './components/SonnerToaster';
import { StatisticsModule } from './components/StatisticsModule';
import { TaskDetailPane } from './components/TaskDetailPane';
import { TaskSidebar } from './components/TaskSidebar';
import { TaskWorkspace } from './components/TaskWorkspace';
import { AppProvider, useApp } from './context/AppContext';

const MainShell: React.FC = () => {
  const { activeModule, toasts, dismissToast } = useApp();

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col md:flex-row bg-zinc-50 text-zinc-900 antialiased">
      {/* Desktop Far-Left Icon Rail + Mobile Bottom Tab Bar */}
      <NavigationRail />

      {/* Center + Right Module Switcher (padded on mobile for bottom tab bar) */}
      <div className="flex-1 flex h-full min-w-0 min-h-0 overflow-hidden pb-14 md:pb-0">
        {activeModule === 'tasks' && (
          <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
            <TaskSidebar />
            <TaskWorkspace />
            <TaskDetailPane />
          </div>
        )}

        {activeModule === 'calendar' && <CalendarModule />}
        {activeModule === 'pomodoro' && <PomodoroModule />}
        {activeModule === 'habits' && <HabitTrackerModule />}
        {activeModule === 'matrix' && <EisenhowerMatrixModule />}
        {(activeModule === 'countdown' || activeModule === 'templates') && <CountdownModule />}
        {activeModule === 'statistics' && <StatisticsModule />}
      </div>

      {/* Global Overlays & Emil Kowalski Sonner Toast Stack */}
      <CommandPaletteModal />
      <SettingsAndSupabaseModal />
      <ActiveReminderModal />
      <SonnerToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}

export default App;

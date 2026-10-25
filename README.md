# ⚡ TickTick Pro (React 19 + TypeScript + Tailwind CSS v4 + Supabase)

<p align="center">
  <a href="https://vijayamukesh13j.github.io/ticktick-pro/">
    <img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Supabase-Local--First%20%7C%20Cloud-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Playwright-18%2F18%20Passing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/Vitest-14%2F14%20Passing-FCC72B?style=for-the-badge&logo=vitest&logoColor=black" alt="Vitest" />
</p>

An enterprise-grade, pixel-polished, and fully responsive clone of **[TickTick](https://ticktick.com/)** and **TickTick Premium**, built with modern web technologies (**React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite 8**).

Features a **local-first reactive state engine** that works 100% offline out-of-the-box, with seamless real-time **Supabase Cloud synchronization** (PostgreSQL + Row-Level Security), procedural **Web Audio API white noise generators**, wall-clock persistent **background Pomodoro & Stopwatch timers**, and a mobile experience crafted under strict **`taste-skill` v2** anti-slop guidelines.

🚀 **Live Production App**: **[https://vijayamukesh13j.github.io/ticktick-pro/](https://vijayamukesh13j.github.io/ticktick-pro/)**

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [Module Deep-Dives](#-module-deep-dives)
  - [1. Smart Tasks & Natural Language Parsing (NLP)](#1-smart-tasks--natural-language-parsing-nlp)
  - [2. Multi-View Workspace (List, Kanban & Timeline Gantt)](#2-multi-view-workspace-list-kanban--timeline-gantt)
  - [3. Full 5-View Interactive Calendar](#3-full-5-view-interactive-calendar)
  - [4. Pomodoro & Stopwatch Focus Studio](#4-pomodoro--stopwatch-focus-studio)
  - [5. Habit Tracker & Reflection Journal](#5-habit-tracker--reflection-journal)
  - [6. Eisenhower Matrix (Taste-Redesigned for Desktop & Mobile)](#6-eisenhower-matrix-taste-redesigned-for-desktop--mobile)
  - [7. Countdown Milestones & Reusable Templates](#7-countdown-milestones--reusable-templates)
  - [8. Productivity Statistics & Achievement Score](#8-productivity-statistics--achievement-score)
- [Mobile UX & Taste-Driven Architecture](#-mobile-ux--taste-driven-architecture)
- [Technical Architecture & State Management](#-technical-architecture--state-management)
- [Database & Multi-Tenant Setup (Supabase)](#-database--multi-tenant-setup-supabase)
- [Getting Started](#-getting-started)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Tech Stack](#-tech-stack)
- [License](#-license)

---

## 🌟 Key Highlights

- **Local-First & Offline-Ready**: Fast initial loads with zero mandatory cloud accounts. All lists, tasks, habits, and focus logs persist locally in `localStorage` and sync seamlessly to Supabase when configured.
- **BYOD (Bring Your Own Database) Multi-Tenant Flow**: First-time users are prompted to connect their own private Supabase instance or remain local-first. Credentials are kept scoped to each client to prevent shared database collisions.
- **Resilient Wall-Clock Timers**: Focus sessions compute time via absolute timestamps (`Date.now()`), allowing timers and stopwatches to continue progressing even when the screen is locked, the device sleeps, or background tabs are throttled by the OS.
- **100% Procedural Web Audio Engine**: Generates 6 ambient soundscapes (Summer Rain, Brown Noise, Forest Wind, Pink Noise, 10Hz Binaural Alpha Waves, and Mechanical Clock Ticks) using the Web Audio API without downloading external audio files.
- **PWA Ready**: Built-in Progressive Web App support with service worker caching, Web App Manifest, offline display mode, and an install prompt modal.
- **Comprehensive Test Coverage**: Tested with **Vitest** (unit tests for NLP, background timers, sound synthesis, and Supabase) and **Playwright** (18 full end-to-end tests across desktop and mobile browsers).

---

## 🛠️ Module Deep-Dives

### 1. Smart Tasks & Natural Language Parsing (NLP)
- **Natural Language Input Engine**: Type everyday sentences to automatically parse task metadata:
  - *Example*: `"Design API tomorrow 2pm-3:30pm #backend !high ~Engineering"`
  - Automatically extracts:
    - **Date & Time**: `tomorrow` starting at `14:00`, ending at `15:30` (90-minute duration).
    - **Priority**: `!high` maps to High Priority (Level 5, Rose).
    - **Tags**: `#backend` automatically matches or creates the tag.
    - **Target List**: `~Engineering` automatically assigns the task to the Engineering list.
    - **Recurrence**: `"every weekday at 9am"` configures Monday–Friday recurring rules.
- **Voice Dictation**: One-tap speech-to-text via the Web Speech API with automatic NLP post-processing.
- **Rich Task Inspector**:
  - Resizable 3-column split view on desktop; native Vaul-style slide-up bottom sheet on mobile.
  - Priority checkboxes with micro-animated check states.
  - Convert between standard Task and **Markdown Note** with full formatting support.
  - Nested Subtasks & Checklists (up to 199 items).
  - File/link attachments, comments, location reminders, email alerts, and activity audit trails.
  - One-click **Markdown Weekly Standup Generator** summarizing completed and upcoming work.

### 2. Multi-View Workspace (List, Kanban & Timeline Gantt)
- **List View**: Pinned section, grouped by time, section, priority, or list, with collapsible completed history.
- **Kanban Board View**: Organize cards across customizable custom list sections or task status columns (`To Do`, `In Progress`, `Done`).
- **Timeline Gantt View (Premium)**: 10-day horizontal scheduling view displaying task durations with interactive one-tap `+1d` duration extensions.

### 3. Full 5-View Interactive Calendar
- **5 Comprehensive Views**: Month, Week, 3-Day (Multi-Day), Day, and Agenda.
- **Time-Blocking Grid**: Drag-and-schedule hourly canvas (`07:00` – `20:00`) with an All-Day event lane.
- **Arrange Tasks Drawer**: Sidebar drawer displaying unscheduled tasks for rapid drag-and-drop time-blocking.
- **External Webcal / iCal Subscriptions**: Subscribe to Google Calendar, Apple iCloud, Outlook, or external `.ics` feeds.

### 4. Pomodoro & Stopwatch Focus Studio
- **Dual Focus Modes**: Standard interval-based Pomodoro Timer (Focus, Short Break, Long Break) and open-ended Stopwatch.
- **Per-Task Focus Binding**: Launch a timer directly bound to any specific task with customizable estimated pomodoros (defaults to 0 for unconstrained focus).
- **Procedural White Noise Synthesizer**:
  - 🌧️ **Summer Rain**: Multi-layered band-pass filtered white noise.
  - ☕ **Warm Study (Brown Noise)**: $1/f^2$ low-frequency acoustic warmth.
  - 🌲 **Pine Forest Wind**: Modulated gain filters simulating natural gusts.
  - 🌊 **Flow State (Pink Noise)**: Balanced $1/f$ spectral density.
  - 🧠 **Alpha Focus**: 10Hz binaural beat generator for deep concentration.
  - ⏱️ **Clock Tick**: Sharp procedural impulse audio.
- **Focus Log Management**: Session history records with category filtering (All / Pomodoro / Stopwatch) and entry deletion.

### 5. Habit Tracker & Reflection Journal
- **Categorization**: Grouped into **Morning**, **Afternoon**, **Evening**, and **Anytime** time slots.
- **Flexible Habit Types**:
  - **Check-in Habits**: Binary daily completion (e.g. Meditate, Floss).
  - **Quantified Target Habits**: Numeric tracking with custom units (e.g. `2,000 ml` Water, `30 pages` Reading).
- **7-Day Matrix & Streak Calculation**: Real-time streak computation with visual historical completion grids.
- **Daily Reflection Journal**: Log daily mood scores, emojis, and written journal entries.

### 6. Eisenhower Matrix (Taste-Redesigned for Desktop & Mobile)
- **The 4 Quadrants**:
  - 🔴 **Q1 — Urgent & Important** (*Do First*): Immediate crises, critical bugs, pressing deadlines.
  - 🟠 **Q2 — Not Urgent & Important** (*Schedule*): Strategic planning, deep work, personal health.
  - 🔵 **Q3 — Urgent & Unimportant** (*Delegate*): Routine chores, interruptions, minor favors.
  - 🟢 **Q4 — Not Urgent & Unimportant** (*Don't Do*): Time wasters, distractions, busywork.
- **Desktop 2×2 Layout**: Independent quadrant grouping (Time, List, Priority, None) and custom sorting.
- **Mobile Ergonomics (`taste-skill` v2)**:
  - **Swipeable Single-Row Chip Rail**: Compact 34px filter bar (`[All] [❶ Do First] [❷ Schedule] [❸ Delegate] [❹ Don't Do]`) keeping content in the top 35% of the screen.
  - **Natural-Height Feed**: Cards expand dynamically to fit their tasks, eliminating nested scrollbar traps.
  - **Mobile Quick-Move Pill**: Tap `Q1 → Q2` directly on touch devices without needing hover states.
  - **Collapsible Quadrant Headers**: Tap any quadrant header in "All" view to collapse or expand it.

### 7. Countdown Milestones & Reusable Templates
- **Countdown Tracker**: Track deadlines, product launches, exams, and milestones with live `Days Left` or `Days Since` badges.
- **Reusable Template Library**: Save task checklists as templates or load pre-built workflows (Daily Standup, Weekly Review, Feature Launch Checklist) in one tap.

### 8. Productivity Statistics & Achievement Score
- **TickTick Achievement Algorithm**: Real-time productivity score factoring in task completions, on-time delivery rates, and habit streaks.
- **Visual Analytics**: 7-day focus hour distribution, habit consistency bars, and task allocations grouped by project list.

---

## 📱 Mobile UX & Taste-Driven Architecture

The mobile interface is designed following **`taste-skill` v2** principles (`references/app-screens.md`):

| Principle | Implementation in TickTick Pro |
|---|---|
| **Flat Surfaces & Data over Chrome** | Pure white and neutral zinc card surfaces with 1px borders; zero heavy artificial shadows. Color is reserved for priorities, statuses, and tags. |
| **No Nested Scroll Traps** | Mobile quadrant cards expand naturally with `h-auto`. The page scrolls as one continuous, unified container. |
| **Ergonomic Touch Targets** | Checkboxes, buttons, and navigation chips have generous 44px+ hit targets. |
| **Top 40% Rule** | Filter bars and navigation rails are compressed to single-row horizontal rails (34–38px) so the first task row is immediately visible without scrolling. |
| **Native Bottom Sheets** | Floating quick-add forms, quadrant reallocators, and view option drawers open as slide-up bottom sheets with drag handles and "Done" dismiss buttons. |
| **Thumb-Friendly FAB** | A floating action button (`+`) positioned at `bottom-18 right-4` above the bottom tab bar enables one-hand task creation. |

---

## 🏗️ Technical Architecture & State Management

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Application                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │            AppContext (Central Provider)         │  │
│  │  - Local-first reactive state (tasks, lists, …)   │  │
│  │  - localStorage JSON persistence                 │  │
│  │  - Wall-clock timestamp sync engine              │  │
│  │  - Web Audio API Sound Synthesizer               │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│              ┌────────────┴────────────┐               │
│              ▼                         ▼               │
│    ┌──────────────────┐      ┌──────────────────┐      │
│    │  localStorage    │      │  Supabase Client │      │
│    │  (Offline-First) │      │  (Remote Sync)   │      │
│    └──────────────────┘      └─────────┬────────┘      │
└────────────────────────────────────────┼───────────────┘
                                         ▼
                               ┌──────────────────┐
                               │  PostgreSQL +    │
                               │  RLS Policies    │
                               └──────────────────┘
```

- **`AppContext` (`src/context/AppContext.tsx`)**: Central hub managing state for tasks, lists, folders, sections, tags, habits, pomodoro logs, countdowns, and templates.
- **`backgroundTimer.ts` (`src/utils/backgroundTimer.ts`)**: Calculates elapsed time using monotonic wall-clock timestamps (`targetEndTime - Date.now()`), rendering timers immune to device sleep and background throttling.
- **`soundEngine.ts` (`src/utils/soundEngine.ts`)**: Low-latency Web Audio API node graphs (BiquadFilter, AudioBufferSource, GainNode, Oscillator) generating procedural noise without network assets.
- **`nlpParser.ts` (`src/utils/nlpParser.ts`)**: Deterministic regular expression & date-fns tokenizer extracting dates, recurring patterns, durations, tags, and priorities from raw text.

---

## 🗄️ Database & Multi-Tenant Setup (Supabase)

TickTick Pro works completely offline by default. To enable cloud synchronization:

### 1. Create a Supabase Project
1. Sign up or log in at [supabase.com](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Open and run [`supabase/schema.sql`](./supabase/schema.sql). This creates all 12 relational tables with Row-Level Security (RLS) enabled:
   - `tasks`
   - `lists`
   - `folders`
   - `sections`
   - `tags`
   - `custom_filters`
   - `habits`
   - `habit_logs`
   - `pomo_sessions`
   - `countdowns`
   - `templates`
   - `calendar_subscriptions`

### 2. Connect Your App
You can connect in either of two ways:

- **Option A (In-App Runtime BYOD)**:
  Open the app, click the **Database / Settings** icon in the sidebar or mobile menu, and enter your **Supabase URL** and **Anon Key**. Credentials are saved to your browser's secure local storage.
- **Option B (Environment Variables)**:
  Create a `.env` file in the project root:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-public-key
  ```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vijayamukesh13j/ticktick-pro.git
cd ticktick-pro

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` to start using the app.

### Production Build

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 Testing & Quality Assurance

TickTick Pro includes automated unit and end-to-end testing suites:

```bash
# Run Vitest unit tests (NLP, background timers, sound engine, Supabase)
npx vitest run

# Run Playwright E2E tests (Desktop & Mobile Chrome)
npx playwright test

# Run Playwright with interactive UI mode
npx playwright test --ui
```

### Test Coverage Highlights
- ✅ **NLP Parsing**: Date, duration, recurrence, and priority token extraction.
- ✅ **Wall-Clock Timers**: Zero drift across backgrounding and simulated device sleep.
- ✅ **Web Audio Synthesis**: Procedural sound generation and offline audio graphs.
- ✅ **Desktop & Mobile Responsive Layouts**: 3-column desktop layout and mobile bottom sheets.
- ✅ **Eisenhower Matrix**: Quick-add cards, sorting, quadrant reallocations, and compact mobile views.
- ✅ **Multi-Tenant Isolation**: First-time user prompts and database credential persistence.

---

## 💻 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Dates**: [date-fns v4](https://date-fns.org/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Testing**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)
- **Deployment**: [GitHub Pages](https://pages.github.com/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with care to bring the power and elegance of <b>TickTick Premium</b> to the open web.
</p>

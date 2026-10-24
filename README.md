# TickTick Pro Clone (React + TypeScript + Supabase)

A full-featured productivity application modeled on [TickTick](https://ticktick.com/) and **TickTick Premium**, built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Supabase** (`@supabase/supabase-js` + PostgreSQL RLS).

---

## ✨ Implemented Features (Core + All Premium Features)

### 1. Tasks, Checklists & Smart Natural Language Parsing (NLP)
- **3-Column Desktop Layout**: Primary Module Rail + Smart Lists/Folders/Tags/Filters Sidebar + Multi-View Workspace + Task Detail Inspector.
- **Live Smart NLP Input**: Type natural phrases like `"Design API tomorrow 2pm-3:30pm #supabase !high ~Work"` or `"Morning standup every weekday at 9am for 15m #meeting !med"` to automatically extract dates, start/end times, duration, recurrence, priority, tags, and target list.
- **Voice Input**: Built-in Web Speech API voice-to-task capture.
- **Multiple View Modes**:
  - **List View** (Pinned section, active tasks, completed tasks, custom list background styles).
  - **Kanban Board View** (Group by custom list Sections or Status columns).
  - **Timeline Gantt View (Premium)** (10-day horizontal duration bars with interactive `+1d` duration extension).
- **Rich Task Inspector**:
  - Priority-colored checkboxes (High, Medium, Low, None)
  - Convert Task ↔ Note (`Markdown` editor)
  - Task Start Date, Due Date, Start Time & **Duration (Premium)**
  - Recurring rules (`daily`, `weekdays`, `weekly`, `monthly`, `yearly`)
  - **Constant Reminder (Premium)**, **Email Alert (Premium)**, and **Location Reminder**
  - Subtasks & Checklists (up to 199 items per task)
  - File/Link Attachments, Team Comments, and **Task Activity Log (Premium)**
  - Save any task as a reusable **Task Template (Premium)**
- **Smart Weekly Summary**: Auto-generates a Markdown standup/weekly report of completed and upcoming tasks.

### 2. Full 5-View Calendar (Premium)
- **Month**, **Week**, **3-Day (Multi-Day)**, **Day**, and **Agenda** views.
- Hourly time-blocking grid (`07:00` – `20:00`) + All-Day row.
- **Arrange Tasks Drawer**: One-click time-blocking for unscheduled tasks.
- **External Calendar Subscriptions (Premium)**: Connect Google Calendar, Outlook, Apple iCloud, or custom Webcal/ICS feeds.

### 3. Pomodoro & Stopwatch Focus Studio (Premium)
- **Pomodoro Timer** (configurable Focus, Short Break, Long Break durations) & **Stopwatch** mode.
- **Web Audio API White Noise Synthesizer (Premium)**: Real-time procedural audio for **Summer Rain**, **Warm Study (Brown Noise)**, **Pine Forest Wind**, **Flow State (Pink Noise)**, **Alpha Focus (10Hz Binaural)**, and **Classic Clock Tick** — works 100% offline with zero external audio dependencies.
- **Focus Analytics & Manual Record Logging**: Track daily Pomo goals, total focus hours, and session history.

### 4. Habit Tracker (Premium)
- Grouped by **Morning**, **Afternoon**, **Evening**, and **Anytime**.
- Supports both **Check-in Habits** and **Quantified Habits** (e.g., `2,000 ml` water, `30 pages` reading).
- 7-day check-in matrix, automatic streak calculation, and **Habit Mood & Reflection Journal**.

### 5. Eisenhower Matrix (Premium)
- 4 Quadrants (**Urgent & Important**, **Not Urgent & Important**, **Urgent & Not Important**, **Not Urgent & Not Important**).
- Add tasks directly into any quadrant or move tasks across quadrants.

### 6. Countdown & Reusable Templates Hub (Premium)
- Track upcoming launches, exams, birthdays, and milestones (`Days Left` / `Days Since`).
- Launch multi-step task checklists from reusable templates in one click.

### 7. Productivity Statistics & Achievement Score (Premium)
- Live **TickTick Achievement Score**, completion rate metrics, 7-day focus & habit consistency bar chart, and task distribution by list.

---

## 🗄️ Supabase Backend Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run [`supabase/schema.sql`](./supabase/schema.sql) to create all 12 tables and Row-Level Security (RLS) policies.
3. Either copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, **or** click the Cloud icon in the bottom-left navigation rail inside the app to connect and sync at runtime.

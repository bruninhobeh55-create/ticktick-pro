-- ============================================================================
-- TickTick Clone (with All Premium Features) - Supabase PostgreSQL Schema
-- ============================================================================
-- Run this in your Supabase SQL Editor to create all tables, indexes, triggers,
-- and Row Level Security (RLS) policies.

create extension if not exists "uuid-ossp";

-- 1. User Profiles & Settings (Themes, Pomodoro Prefs, Productivity Score)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_premium boolean default true not null,
  theme text default 'classic-blue' not null,
  achievement_score integer default 1420 not null,
  pomo_duration integer default 25 not null,
  short_break_duration integer default 5 not null,
  long_break_duration integer default 15 not null,
  long_break_interval integer default 4 not null,
  auto_start_breaks boolean default false not null,
  auto_start_pomos boolean default false not null,
  daily_pomo_goal integer default 8 not null,
  daily_focus_minutes_goal integer default 180 not null,
  timezone text default 'UTC' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Folders (Group Custom Lists)
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_collapsed boolean default false not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- 3. Lists (Up to 299 in Premium, with custom colors & backgrounds)
create table if not exists public.lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  color text default '#4772fa' not null,
  icon text default 'list' not null,
  background_style text default 'none' not null,
  view_mode text default 'list' check (view_mode in ('list', 'kanban', 'timeline')) not null,
  is_shared boolean default false not null,
  members jsonb default '[]'::jsonb not null,
  sort_order integer default 0 not null,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Sections (Kanban columns / List groupings inside a List)
create table if not exists public.sections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.lists(id) on delete cascade,
  name text not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- 5. Tasks & Notes (Supports Duration, Recurring, Constant Reminder, Eisenhower override, etc.)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null, -- Can be 'inbox' or a uuid referencing public.lists(id)
  section_id uuid references public.sections(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  content text default '' not null, -- Markdown content
  is_note boolean default false not null, -- Task vs Note mode
  status text default 'todo' check (status in ('todo', 'in_progress', 'completed', 'wont_do', 'trash')) not null,
  priority integer default 0 check (priority in (0, 1, 3, 5)) not null, -- 0: None, 1: Low, 3: Medium, 5: High
  tags text[] default '{}' not null,
  start_date timestamptz,
  due_date timestamptz,
  is_all_day boolean default true not null,
  duration_minutes integer, -- Premium: Task Duration
  recurrence_rule text, -- e.g., 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom:...'
  reminders jsonb default '[]'::jsonb not null, -- Up to 5 reminders per task (Premium)
  constant_reminder boolean default false not null, -- Premium: Keep ringing until completed
  email_reminder boolean default false not null, -- Premium: Email alert
  location_reminder text, -- Premium: Location trigger
  timezone text,
  assignee text,
  estimated_pomos integer default 0 not null,
  completed_pomos integer default 0 not null,
  focus_seconds integer default 0 not null,
  subtasks jsonb default '[]'::jsonb not null, -- Array of {id, title, completed, reminder_at, priority}
  attachments jsonb default '[]'::jsonb not null, -- Array of {id, name, size, url, type, uploaded_at}
  comments jsonb default '[]'::jsonb not null, -- Array of {id, author, text, created_at}
  activities jsonb default '[]'::jsonb not null, -- Premium: Task Activity History
  eisenhower_quadrant text check (eisenhower_quadrant in ('q1', 'q2', 'q3', 'q4')),
  is_pinned boolean default false not null,
  sort_order integer default 0 not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. Tags (With color coding and parent tag nesting)
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#4772fa' not null,
  parent_tag text,
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

-- 7. Smart Custom Filters (Premium unlimited filters)
create table if not exists public.custom_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#4772fa' not null,
  criteria jsonb not null, -- {priorities, tags, listIds, dateRange, status, keyword}
  created_at timestamptz default now() not null
);

-- 8. Habits (Premium Unlimited Habits + Detailed Tracking)
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quote text default '' not null,
  icon text default 'sparkles' not null,
  color text default '#10b981' not null,
  section text default 'morning' check (section in ('morning', 'afternoon', 'evening', 'anytime')) not null,
  frequency_type text default 'daily' check (frequency_type in ('daily', 'weekly_days', 'weekly_count')) not null,
  frequency_days integer[] default '{0,1,2,3,4,5,6}' not null,
  frequency_count integer default 7 not null,
  goal_type text default 'check' check (goal_type in ('check', 'quantified')) not null,
  target_value numeric default 1 not null,
  unit text default 'times' not null,
  reminder_time text,
  auto_pop_log boolean default true not null,
  logs jsonb default '{}'::jsonb not null, -- Map of 'YYYY-MM-DD' -> {value, completed, note, mood, timestamp}
  archived boolean default false not null,
  created_at timestamptz default now() not null
);

-- 9. Pomodoro & Stopwatch Focus Sessions
create table if not exists public.pomodoro_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  task_title text not null,
  mode text default 'pomo' check (mode in ('pomo', 'stopwatch')) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null,
  note text default '' not null,
  white_noise_used text,
  created_at timestamptz default now() not null
);

-- 10. Countdowns (Day Counter - Up to 299 in Premium)
create table if not exists public.countdowns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date not null,
  category text default 'milestone' check (category in ('milestone', 'birthday', 'anniversary', 'holiday', 'exam', 'work')) not null,
  color text default '#4772fa' not null,
  icon text default 'calendar-heart' not null,
  repeat_cycle text default 'none' check (repeat_cycle in ('none', 'yearly', 'monthly')) not null,
  is_pinned boolean default false not null,
  created_at timestamptz default now() not null
);

-- 11. Reusable Task Templates (Premium)
create table if not exists public.task_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title text not null,
  content text default '' not null,
  priority integer default 0 not null,
  tags text[] default '{}' not null,
  subtasks jsonb default '[]'::jsonb not null,
  duration_minutes integer,
  created_at timestamptz default now() not null
);

-- 12. External Calendar Subscriptions (Premium Webcal/ICS Sync)
create table if not exists public.calendar_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  color text default '#8b5cf6' not null,
  provider text default 'google' check (provider in ('google', 'outlook', 'apple', 'ics')) not null,
  enabled boolean default true not null,
  events jsonb default '[]'::jsonb not null,
  last_synced_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.lists enable row level security;
alter table public.sections enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.custom_filters enable row level security;
alter table public.habits enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.countdowns enable row level security;
alter table public.task_templates enable row level security;
alter table public.calendar_subscriptions enable row level security;

-- Owner Policies
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own folders" on public.folders for all using (auth.uid() = user_id);
create policy "Users manage own lists" on public.lists for all using (auth.uid() = user_id);
create policy "Users manage own sections" on public.sections for all using (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id);
create policy "Users manage own custom_filters" on public.custom_filters for all using (auth.uid() = user_id);
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);
create policy "Users manage own pomodoro_sessions" on public.pomodoro_sessions for all using (auth.uid() = user_id);
create policy "Users manage own countdowns" on public.countdowns for all using (auth.uid() = user_id);
create policy "Users manage own task_templates" on public.task_templates for all using (auth.uid() = user_id);
create policy "Users manage own calendar_subscriptions" on public.calendar_subscriptions for all using (auth.uid() = user_id);

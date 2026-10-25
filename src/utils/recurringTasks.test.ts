import { describe, it, expect } from 'vitest';
import {
  getNextOccurrenceDate,
  isTaskDueOnDate,
  isTaskDueInDateRange,
} from './recurringTasks';
import { Task } from '../types';

describe('recurringTasks utility', () => {
  it('correctly advances daily tasks', () => {
    expect(getNextOccurrenceDate('2026-10-25', 'daily')).toBe('2026-10-26');
    expect(getNextOccurrenceDate('2026-12-31', 'daily')).toBe('2027-01-01');
  });

  it('correctly advances weekdays tasks skipping weekends', () => {
    // Friday -> Monday
    expect(getNextOccurrenceDate('2026-10-23', 'weekdays')).toBe('2026-10-26');
    // Monday -> Tuesday
    expect(getNextOccurrenceDate('2026-10-26', 'weekdays')).toBe('2026-10-27');
  });

  it('correctly advances weekly, monthly, and yearly tasks', () => {
    expect(getNextOccurrenceDate('2026-10-25', 'weekly')).toBe('2026-11-01');
    expect(getNextOccurrenceDate('2026-10-25', 'monthly')).toBe('2026-11-25');
    expect(getNextOccurrenceDate('2026-10-25', 'yearly')).toBe('2027-10-25');
  });

  it('evaluates isTaskDueOnDate for recurring rules', () => {
    const dailyTask: Task = {
      id: 'task-1',
      title: 'Daily Standup',
      content: '',
      isNote: false,
      isAllDay: true,
      status: 'todo',
      priority: 3,
      listId: 'inbox',
      dueDate: '2026-10-25',
      recurrenceRule: 'daily',
      tags: [],
      subtasks: [],
      attachments: [],
      comments: [],
      activities: [],
      reminders: [],
      constantReminder: false,
      emailReminder: false,
      estimatedPomos: 0,
      completedPomos: 0,
      focusSeconds: 0,
      isPinned: false,
      sortOrder: 0,
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    };

    // Past date before initial dueDate
    expect(isTaskDueOnDate(dailyTask, '2026-10-24')).toBe(false);
    // Exact due date
    expect(isTaskDueOnDate(dailyTask, '2026-10-25')).toBe(true);
    // Future date
    expect(isTaskDueOnDate(dailyTask, '2026-10-26')).toBe(true);
    expect(isTaskDueOnDate(dailyTask, '2026-11-15')).toBe(true);

    const weekdayTask: Task = {
      ...dailyTask,
      id: 'task-2',
      dueDate: '2026-10-23', // Friday
      recurrenceRule: 'weekdays',
    };
    expect(isTaskDueOnDate(weekdayTask, '2026-10-24')).toBe(false); // Saturday
    expect(isTaskDueOnDate(weekdayTask, '2026-10-25')).toBe(false); // Sunday
    expect(isTaskDueOnDate(weekdayTask, '2026-10-26')).toBe(true); // Monday

    const weeklyTask: Task = {
      ...dailyTask,
      id: 'task-3',
      dueDate: '2026-10-25', // Sunday
      recurrenceRule: 'weekly',
    };
    expect(isTaskDueOnDate(weeklyTask, '2026-10-25')).toBe(true); // Sunday
    expect(isTaskDueOnDate(weeklyTask, '2026-10-26')).toBe(false); // Monday
    expect(isTaskDueOnDate(weeklyTask, '2026-11-01')).toBe(true); // Next Sunday
  });

  it('checks isTaskDueInDateRange accurately', () => {
    const weeklyTask: Task = {
      id: 'task-3',
      title: 'Weekly Review',
      content: '',
      isNote: false,
      isAllDay: true,
      status: 'todo',
      priority: 1,
      listId: 'inbox',
      dueDate: '2026-10-25', // Sunday
      recurrenceRule: 'weekly',
      tags: [],
      subtasks: [],
      attachments: [],
      comments: [],
      activities: [],
      reminders: [],
      constantReminder: false,
      emailReminder: false,
      estimatedPomos: 0,
      completedPomos: 0,
      focusSeconds: 0,
      isPinned: false,
      sortOrder: 0,
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    };

    // Range Oct 26 to Oct 31 (Mon - Sat) -> does not include Sunday
    expect(isTaskDueInDateRange(weeklyTask, '2026-10-26', '2026-10-31')).toBe(false);
    // Range Oct 26 to Nov 02 -> includes Nov 01 (Sunday)
    expect(isTaskDueInDateRange(weeklyTask, '2026-10-26', '2026-11-02')).toBe(true);
  });
});

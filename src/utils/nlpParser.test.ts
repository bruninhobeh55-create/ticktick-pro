import { describe, expect, it } from 'vitest';
import { parseNaturalLanguageTask } from './nlpParser';

describe('parseNaturalLanguageTask', () => {
  it('extracts tags, priority, list, time range, and duration from natural language input', () => {
    const res = parseNaturalLanguageTask(
      'Review Supabase RLS policies tomorrow 2pm-3:30pm #supabase #deep-work !high ~Engineering'
    );
    expect(res.cleanTitle).toBe('Review Supabase RLS policies');
    expect(res.priority).toBe(5);
    expect(res.tags).toEqual(['supabase', 'deep-work']);
    expect(res.listName).toBe('Engineering');
    expect(res.startTime).toBe('14:00');
    expect(res.endTime).toBe('15:30');
    expect(res.durationMinutes).toBe(90);
    expect(res.dueDate).toBeDefined();
  });

  it('extracts recurrence rules and explicit duration', () => {
    const res = parseNaturalLanguageTask('Morning standup every weekday at 9am for 15m #meeting !med');
    expect(res.cleanTitle).toBe('Morning standup');
    expect(res.recurrenceRule).toBe('weekdays');
    expect(res.startTime).toBe('09:00');
    expect(res.durationMinutes).toBe(15);
    expect(res.priority).toBe(3);
  });
});

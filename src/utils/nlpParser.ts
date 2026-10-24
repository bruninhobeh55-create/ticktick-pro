import { addDays, format, nextMonday, startOfToday } from 'date-fns';
import { Priority } from '../types';

export interface ParsedTaskInput {
  cleanTitle: string;
  dueDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes?: number;
  priority?: Priority;
  tags: string[];
  listName?: string;
  recurrenceRule?: string;
  detectedTokens: {
    type: 'date' | 'time' | 'priority' | 'tag' | 'list' | 'recurrence';
    raw: string;
    label: string;
  }[];
}

/**
 * TickTick Smart Natural Language Parser (NLP)
 * Recognizes:
 * - #tag (e.g. #work #urgent)
 * - ~listName or ^listName (e.g. ~Work ^Personal)
 * - !high, !medium, !low, !!!, !!, ! (Priority)
 * - "today", "tomorrow", "tmr", "next week", "next monday", "in X days"
 * - "every day", "daily", "weekly", "monthly", "every weekday"
 * - Time & Duration ranges: "at 3pm", "14:30", "3pm-4:30pm", "10:00-11:30", "for 45m", "for 2h"
 */
export function parseNaturalLanguageTask(rawInput: string): ParsedTaskInput {
  let working = rawInput;
  const tags: string[] = [];
  const detectedTokens: ParsedTaskInput['detectedTokens'] = [];
  let priority: Priority | undefined;
  let listName: string | undefined;
  let dueDate: string | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let durationMinutes: number | undefined;
  let recurrenceRule: string | undefined;

  const today = startOfToday();

  // 1. Extract #tags
  working = working.replace(/(?:^|\s)#([a-zA-Z0-9_-]+)/g, (_match, tag) => {
    const normalized = tag.toLowerCase();
    if (!tags.includes(normalized)) {
      tags.push(normalized);
      detectedTokens.push({ type: 'tag', raw: `#${tag}`, label: `#${normalized}` });
    }
    return ' ';
  });

  // 2. Extract ~List or ^List
  working = working.replace(/(?:^|\s)[~^]([a-zA-Z0-9_-]+)/g, (_match, list) => {
    listName = list;
    detectedTokens.push({ type: 'list', raw: `~${list}`, label: `List: ${list}` });
    return ' ';
  });

  // 3. Extract Priority (!high, !medium, !low, !none, !!!, !!, !)
  working = working.replace(/(?:^|\s)(!high|!urgent|!!!|!p1)(?=\s|$)/i, (match) => {
    priority = 5;
    detectedTokens.push({ type: 'priority', raw: match.trim(), label: 'High Priority' });
    return ' ';
  });
  working = working.replace(/(?:^|\s)(!medium|!med|!!|!p2)(?=\s|$)/i, (match) => {
    if (priority === undefined) {
      priority = 3;
      detectedTokens.push({ type: 'priority', raw: match.trim(), label: 'Medium Priority' });
    }
    return ' ';
  });
  working = working.replace(/(?:^|\s)(!low|!|!p3)(?=\s|$)/i, (match) => {
    if (priority === undefined) {
      priority = 1;
      detectedTokens.push({ type: 'priority', raw: match.trim(), label: 'Low Priority' });
    }
    return ' ';
  });

  // 4. Extract Recurrence ("every day", "daily", "weekly", "monthly", "every weekday")
  const recurrencePatterns: { regex: RegExp; rule: string; label: string }[] = [
    { regex: /\b(every\s+day|daily)\b/i, rule: 'daily', label: 'Repeats Daily' },
    { regex: /\b(every\s+weekday|weekdays)\b/i, rule: 'weekdays', label: 'Repeats Weekdays' },
    { regex: /\b(every\s+week|weekly)\b/i, rule: 'weekly', label: 'Repeats Weekly' },
    { regex: /\b(every\s+month|monthly)\b/i, rule: 'monthly', label: 'Repeats Monthly' },
    { regex: /\b(every\s+year|yearly|annually)\b/i, rule: 'yearly', label: 'Repeats Yearly' },
  ];
  for (const item of recurrencePatterns) {
    const m = working.match(item.regex);
    if (m) {
      recurrenceRule = item.rule;
      if (!dueDate) {
        dueDate = format(today, 'yyyy-MM-dd');
      }
      detectedTokens.push({ type: 'recurrence', raw: m[0], label: item.label });
      working = working.replace(item.regex, ' ');
      break;
    }
  }

  // 5. Extract Date keywords ("today", "tonight", "tomorrow", "tmr", "next monday", "next week", "in X days")
  const inDaysMatch = working.match(/\bin\s+(\d{1,2})\s+days?\b/i);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    dueDate = format(addDays(today, days), 'yyyy-MM-dd');
    detectedTokens.push({
      type: 'date',
      raw: inDaysMatch[0],
      label: format(addDays(today, days), 'MMM d'),
    });
    working = working.replace(inDaysMatch[0], ' ');
  } else if (/\b(today|tonight|tod)\b/i.test(working)) {
    const m = working.match(/\b(today|tonight|tod)\b/i)!;
    dueDate = format(today, 'yyyy-MM-dd');
    detectedTokens.push({ type: 'date', raw: m[0], label: 'Today' });
    working = working.replace(/\b(today|tonight|tod)\b/i, ' ');
  } else if (/\b(tomorrow|tmr|tmrw)\b/i.test(working)) {
    const m = working.match(/\b(tomorrow|tmr|tmrw)\b/i)!;
    dueDate = format(addDays(today, 1), 'yyyy-MM-dd');
    detectedTokens.push({ type: 'date', raw: m[0], label: 'Tomorrow' });
    working = working.replace(/\b(tomorrow|tmr|tmrw)\b/i, ' ');
  } else if (/\b(next\s+week|next\s+monday)\b/i.test(working)) {
    const m = working.match(/\b(next\s+week|next\s+monday)\b/i)!;
    const target = nextMonday(today);
    dueDate = format(target, 'yyyy-MM-dd');
    detectedTokens.push({ type: 'date', raw: m[0], label: format(target, 'EEE, MMM d') });
    working = working.replace(/\b(next\s+week|next\s+monday)\b/i, ' ');
  }

  // 6. Extract Time Range (e.g., "3pm-4:30pm", "14:00 - 15:30", "from 9am to 10:30am")
  const rangeMatch = working.match(
    /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );
  if (rangeMatch) {
    const sHourRaw = parseInt(rangeMatch[1], 10);
    const sMin = parseInt(rangeMatch[2] || '0', 10);
    const sMeridiem = (rangeMatch[3] || rangeMatch[6] || '').toLowerCase();
    const eHourRaw = parseInt(rangeMatch[4], 10);
    const eMin = parseInt(rangeMatch[5] || '0', 10);
    const eMeridiem = (rangeMatch[6] || '').toLowerCase();

    const sHour = to24Hour(sHourRaw, sMeridiem);
    const eHour = to24Hour(eHourRaw, eMeridiem);

    startTime = `${String(sHour).padStart(2, '0')}:${String(sMin).padStart(2, '0')}`;
    endTime = `${String(eHour).padStart(2, '0')}:${String(eMin).padStart(2, '0')}`;
    const diff = eHour * 60 + eMin - (sHour * 60 + sMin);
    if (diff > 0) {
      durationMinutes = diff;
    }
    if (!dueDate) {
      dueDate = format(today, 'yyyy-MM-dd');
    }
    detectedTokens.push({
      type: 'time',
      raw: rangeMatch[0],
      label: `${startTime} – ${endTime}${durationMinutes ? ` (${durationMinutes}m)` : ''}`,
    });
    working = working.replace(rangeMatch[0], ' ');
  } else {
    // Single time e.g. "at 3pm", "at 15:30", "3:30pm"
    const singleTimeMatch = working.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (singleTimeMatch) {
      const hourRaw = parseInt(singleTimeMatch[1], 10);
      const min = parseInt(singleTimeMatch[2] || '0', 10);
      const meridiem = singleTimeMatch[3].toLowerCase();
      const hour = to24Hour(hourRaw, meridiem);
      startTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      if (!dueDate) {
        dueDate = format(today, 'yyyy-MM-dd');
      }
      detectedTokens.push({
        type: 'time',
        raw: singleTimeMatch[0],
        label: startTime,
      });
      working = working.replace(singleTimeMatch[0], ' ');
    }
  }

  // 7. Extract explicit duration ("for 45m", "for 2h")
  const durationMatch = working.match(/\bfor\s+(\d{1,3})\s*(m|min|mins|minutes|h|hr|hrs|hours)\b/i);
  if (durationMatch) {
    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    durationMinutes = unit.startsWith('h') ? amount * 60 : amount;
    detectedTokens.push({
      type: 'time',
      raw: durationMatch[0],
      label: `Duration: ${durationMinutes}m`,
    });
    working = working.replace(durationMatch[0], ' ');
  }

  const cleanTitle = working.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle: cleanTitle || rawInput.trim(),
    dueDate,
    startTime,
    endTime,
    durationMinutes,
    priority,
    tags,
    listName,
    recurrenceRule,
    detectedTokens,
  };
}

function to24Hour(hour: number, meridiem: string): number {
  if (meridiem === 'pm' && hour < 12) return hour + 12;
  if (meridiem === 'am' && hour === 12) return 0;
  return hour;
}

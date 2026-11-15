import { Translatable } from '../i18n/translation';
import { Task } from '../models';
import { daysFromToday } from './date';

export function isOverdue(task: Task, today = new Date()): boolean {
  return task.status !== 'done' && daysFromToday(task.dueDate, today) < 0;
}

/**
 * Text for the due date (or completed date) as a translation key.
 * We count days only, not hours. 7, 14... days show as weeks.
 */
export function dueLabel(task: Task, today = new Date()): Translatable {
  if (task.status === 'done') {
    return completedLabel(task, today);
  }

  const days = daysFromToday(task.dueDate, today);

  if (days < 0) return { key: 'due.overdue', params: { count: -days } };
  if (days === 0) return { key: 'due.today' };
  if (days === 1) return { key: 'due.tomorrow' };
  if (days % 7 === 0) return { key: 'due.inWeeks', params: { count: days / 7 } };
  return { key: 'due.inDays', params: { count: days } };
}

function completedLabel(task: Task, today: Date): Translatable {
  if (!task.completedAt) return { key: 'due.completed' };

  const days = -daysFromToday(new Date(task.completedAt), today);

  if (days <= 0) return { key: 'due.completedToday' };
  if (days === 1) return { key: 'due.completedYesterday' };
  return { key: 'due.completedDaysAgo', params: { count: days } };
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function matchesSearch(task: Task, term: string): boolean {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query);
}

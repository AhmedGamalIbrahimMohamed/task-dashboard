import { Assignee, Task, TaskDraft } from '../app/core/models';
import { toDateKey } from '../app/core/utils/date';

export const USERS: Assignee[] = [
  { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' },
  { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah.smith@company.com' },
];

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes for the homepage',
    status: 'todo',
    priority: 'high',
    dueDate: daysFromNow(2),
    assignee: USERS[0],
    tags: ['Design'],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

export function toDraft(task: Task): TaskDraft {
  const { title, description, status, priority, dueDate, assignee, tags } = task;
  return { title, description, status, priority, dueDate, assignee, tags };
}

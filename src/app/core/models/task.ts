export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue?: boolean;
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'
>;

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | null;
  assigneeId: string | null;
}

export interface TaskMove {
  task: Task;
  status: TaskStatus;
  index: number;
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export const TASK_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

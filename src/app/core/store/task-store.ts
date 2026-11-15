import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Activity, Task, TaskDraft, TaskFilters, TaskMove, TaskStatus } from '../models';
import { TaskApi } from '../services/task-api';
import { isOverdue, matchesSearch } from '../utils/task';

const INITIAL_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: null,
  assigneeId: null,
};

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly api = inject(TaskApi);
  private readonly resource = this.api.tasksResource();
  private readonly deletions = signal<Activity[]>([]);

  readonly tasks = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
  readonly filters = signal<TaskFilters>(INITIAL_FILTERS);

  /**
   * Tasks after filters and search.
   * Overdue tasks go first. move() uses the same order.
   */
  readonly filteredTasks = computed(() => {
    const { search, status, priority, assigneeId } = this.filters();

    return this.tasks()
      .filter(
        (task) =>
          (status === 'all' || task.status === status) &&
          (!priority || task.priority === priority) &&
          (!assigneeId || task.assignee.id === assigneeId) &&
          matchesSearch(task, search),
      )
      .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)));
  });

  readonly counts = computed(() => {
    const tasks = this.tasks();
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'done').length,
      overdue: tasks.filter((task) => isOverdue(task)).length,
    };
  });

  /**
   * Last change of every task + deleted tasks, newest first.
   */
  readonly activities = computed(() => {
    const fromTasks = this.tasks().map((task) => this.toActivity(task));
    return [...fromTasks, ...this.deletions()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  });

  reload(): void {
    this.resource.reload();
  }

  updateFilters(changes: Partial<TaskFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...changes }));
  }

  resetFilters(): void {
    this.filters.set(INITIAL_FILTERS);
  }

  create(draft: TaskDraft): Observable<Task> {
    const now = new Date().toISOString();
    const task: Omit<Task, 'id'> = {
      ...draft,
      createdAt: now,
      updatedAt: now,
      completedAt: draft.status === 'done' ? now : undefined,
    };

    return this.api
      .create(task)
      .pipe(tap((created) => this.resource.set([created, ...this.tasks()])));
  }

  update(task: Task, draft: TaskDraft): Observable<Task> {
    const updated = this.withStatus({ ...task, ...draft }, draft.status, task.status);

    return this.api.update(updated).pipe(tap((saved) => this.replace(saved)));
  }

  delete(task: Task): Observable<unknown> {
    return this.api.delete(task.id).pipe(
      tap(() => {
        this.resource.set(this.tasks().filter((item) => item.id !== task.id));
        this.deletions.update((items) => [
          {
            id: `deleted-${task.id}`,
            type: 'deleted',
            taskTitle: task.title,
            userName: task.assignee.name,
            date: new Date().toISOString(),
          },
          ...items,
        ]);
      }),
    );
  }

  /**
   * Called after drag and drop.
   * index is the position in the column on screen, so we put the task
   * before the task at that index (or at the end of the column).
   * UI updates first, then we save only if the status changed.
   * If the save fails we go back to the old list.
   */
  move({ task, status, index }: TaskMove): void {
    const previous = this.tasks();
    const moved = this.withStatus({ ...task }, status, task.status);
    const rest = previous.filter((item) => item.id !== task.id);
    const column = this.filteredTasks().filter(
      (item) => item.status === status && item.id !== task.id,
    );
    const anchor = column[index];
    const lastInColumn = column.at(-1);
    const position = anchor
      ? rest.findIndex((item) => item.id === anchor.id)
      : lastInColumn
        ? rest.findIndex((item) => item.id === lastInColumn.id) + 1
        : rest.length;

    rest.splice(position, 0, moved);
    this.resource.set(rest);

    if (status !== task.status) {
      this.api.update(moved).subscribe({ error: () => this.resource.set(previous) });
    }
  }

  private replace(task: Task): void {
    this.resource.set(this.tasks().map((item) => (item.id === task.id ? task : item)));
  }

  private withStatus(task: Task, status: TaskStatus, previousStatus: TaskStatus): Task {
    if (status === previousStatus) {
      return { ...task, updatedAt: new Date().toISOString() };
    }

    const now = new Date().toISOString();
    return {
      ...task,
      status,
      updatedAt: now,
      completedAt: status === 'done' ? now : undefined,
    };
  }

  private toActivity(task: Task): Activity {
    const base = { taskTitle: task.title, userName: task.assignee.name };

    if (task.status === 'done' && task.completedAt) {
      return { ...base, id: `completed-${task.id}`, type: 'completed', date: task.completedAt };
    }
    if (task.createdAt === task.updatedAt) {
      return { ...base, id: `created-${task.id}`, type: 'created', date: task.createdAt };
    }
    return { ...base, id: `updated-${task.id}`, type: 'updated', date: task.updatedAt };
  }
}

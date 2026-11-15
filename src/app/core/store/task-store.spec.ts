import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { daysFromNow, makeTask, toDraft, USERS } from '../../../testing/task-factory';
import { Task } from '../models';
import { TaskStore } from './task-store';

describe('TaskStore', () => {
  let store: TaskStore;
  let controller: HttpTestingController;

  const tasks: Task[] = [
    makeTask({ id: 'task-001', title: 'Design homepage', status: 'todo', priority: 'high' }),
    makeTask({
      id: 'task-002',
      title: 'Write docs',
      status: 'todo',
      priority: 'low',
      assignee: USERS[1],
    }),
    makeTask({
      id: 'task-003',
      title: 'Budget report',
      status: 'in_progress',
      priority: 'medium',
      dueDate: daysFromNow(-2),
    }),
    makeTask({
      id: 'task-004',
      title: 'Fix login',
      status: 'done',
      completedAt: '2026-01-03T10:00:00.000Z',
    }),
  ];

  async function settle() {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  async function load(data: Task[] = tasks) {
    TestBed.tick();
    controller.expectOne('api/tasks').flush(data);
    await settle();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads tasks and computes counts', async () => {
    await load();

    expect(store.tasks()).toHaveLength(4);
    expect(store.counts()).toEqual({
      total: 4,
      todo: 2,
      inProgress: 1,
      completed: 1,
      overdue: 1,
    });
  });

  it('exposes request errors', async () => {
    TestBed.tick();
    controller.expectOne('api/tasks').flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(store.error()).toBeTruthy();
  });

  it('reloads tasks', async () => {
    await load();

    store.reload();
    TestBed.tick();
    controller.expectOne('api/tasks').flush([tasks[0]]);
    await settle();

    expect(store.tasks()).toHaveLength(1);
  });

  it('filters by status, priority, assignee and search', async () => {
    await load();

    store.updateFilters({ status: 'todo' });
    expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-001', 'task-002']);

    store.updateFilters({ priority: 'low' });
    expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-002']);

    store.resetFilters();
    store.updateFilters({ assigneeId: USERS[1].id });
    expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-002']);

    store.resetFilters();
    store.updateFilters({ search: 'budget' });
    expect(store.filteredTasks().map((task) => task.id)).toEqual(['task-003']);
  });

  it('lists overdue tasks first', async () => {
    await load();

    expect(store.filteredTasks()[0].id).toBe('task-003');
  });

  it('creates a task and adds it to the top', async () => {
    await load();

    store.create(toDraft(makeTask({ title: 'New task', status: 'done' }))).subscribe();
    const request = controller.expectOne('api/tasks');
    expect(request.request.body.completedAt).toBeDefined();
    request.flush({ ...request.request.body, id: 'task-005' });

    expect(store.tasks()[0].id).toBe('task-005');
  });

  it('updates a task and sets the completion date', async () => {
    await load();
    const task = tasks[0];

    store.update(task, { ...toDraft(task), status: 'done' }).subscribe();
    const request = controller.expectOne(`api/tasks/${task.id}`);
    expect(request.request.body.completedAt).toBeDefined();
    request.flush(request.request.body);

    expect(store.tasks().find((item) => item.id === task.id)?.status).toBe('done');
  });

  it('keeps the completion date when the status does not change', async () => {
    await load();
    const task = tasks[3];

    store.update(task, { ...toDraft(task), title: 'Fix login on mobile' }).subscribe();
    const request = controller.expectOne(`api/tasks/${task.id}`);
    expect(request.request.body.completedAt).toBe(task.completedAt);
    request.flush(request.request.body);
  });

  it('deletes a task and records the activity', async () => {
    await load();

    store.delete(tasks[1]).subscribe();
    controller.expectOne(`api/tasks/${tasks[1].id}`).flush(null);

    expect(store.tasks().some((task) => task.id === tasks[1].id)).toBe(false);
    expect(store.activities()[0]).toEqual(
      expect.objectContaining({ type: 'deleted', taskTitle: 'Write docs' }),
    );
  });

  it('builds the activity feed from task history', async () => {
    await load([
      makeTask({ id: 'a', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }),
      makeTask({ id: 'b', updatedAt: '2026-01-05T00:00:00Z' }),
      makeTask({ id: 'c', status: 'done', completedAt: '2026-01-04T00:00:00Z' }),
    ]);

    expect(store.activities().map((activity) => activity.type)).toEqual([
      'updated',
      'completed',
      'created',
    ]);
  });

  it('moves a task to another column and saves the new status', async () => {
    await load();

    store.move({ task: tasks[0], status: 'done', index: 0 });
    const request = controller.expectOne(`api/tasks/${tasks[0].id}`);
    request.flush(request.request.body);

    const ids = store.tasks().map((task) => task.id);
    expect(ids.indexOf('task-001')).toBe(ids.indexOf('task-004') - 1);
    expect(store.tasks().find((task) => task.id === 'task-001')?.status).toBe('done');
  });

  it('appends to the end of a column', async () => {
    await load();

    store.move({ task: tasks[1], status: 'in_progress', index: 5 });
    controller.expectOne(`api/tasks/${tasks[1].id}`).flush({});

    const ids = store.tasks().map((task) => task.id);
    expect(ids.indexOf('task-002')).toBe(ids.indexOf('task-003') + 1);
  });

  it('reorders inside a column without saving', async () => {
    await load();

    store.move({ task: tasks[1], status: 'todo', index: 0 });

    expect(store.tasks()[0].id).toBe('task-002');
  });

  it('moves into an empty column', async () => {
    await load([tasks[0]]);

    store.move({ task: tasks[0], status: 'in_progress', index: 0 });
    controller.expectOne(`api/tasks/${tasks[0].id}`).flush({});

    expect(store.tasks()[0].status).toBe('in_progress');
  });

  it('rolls back a move when saving fails', async () => {
    await load();

    store.move({ task: tasks[0], status: 'done', index: 0 });
    controller
      .expectOne(`api/tasks/${tasks[0].id}`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(store.tasks()).toEqual(tasks);
  });
});

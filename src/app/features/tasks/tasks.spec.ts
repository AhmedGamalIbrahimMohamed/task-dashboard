import { TestBed } from '@angular/core/testing';
import {
  provideAppTesting,
  respondWithData,
  respondWithError,
  mockTaskDialog,
  settle,
} from '../../../testing/http-testing';
import { daysFromNow, makeTask, USERS } from '../../../testing/task-factory';
import { TaskActions } from './task-actions';
import { TaskStore } from '../../core/store/task-store';
import { Tasks } from './tasks';

describe('Tasks page', () => {
  const tasks = [
    makeTask({ id: 'task-001', title: 'Design homepage', status: 'todo' }),
    makeTask({
      id: 'task-002',
      title: 'Budget report',
      status: 'in_progress',
      dueDate: daysFromNow(-1),
      assignee: USERS[1],
    }),
    makeTask({ id: 'task-003', title: 'Fix login', status: 'done', completedAt: '2026-01-01' }),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppTesting() });
  });

  it('lists tasks with status, due label and overdue highlight', async () => {
    const fixture = TestBed.createComponent(Tasks);
    await respondWithData(tasks);
    await settle();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(fixture.nativeElement.querySelectorAll('.row-overdue')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('In Progress');
    expect(fixture.nativeElement.textContent).toContain('Overdue by 1 day');
  });

  it('shows the clear filters button only when filters are active', async () => {
    const fixture = TestBed.createComponent(Tasks);
    const store = TestBed.inject(TaskStore);
    await respondWithData(tasks);
    await settle();
    expect(fixture.nativeElement.textContent).not.toContain('Clear filters');

    store.updateFilters({ assigneeId: USERS[1].id });
    await settle();
    await settle();

    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Clear filters');
  });

  it('shows an empty message when nothing matches', async () => {
    const fixture = TestBed.createComponent(Tasks);
    TestBed.inject(TaskStore).updateFilters({ search: 'nothing-matches' });
    await respondWithData(tasks);
    await settle();

    expect(fixture.nativeElement.textContent).toContain('No tasks match your filters.');
  });

  it('opens add, view, edit and delete from the page', async () => {
    const fixture = TestBed.createComponent(Tasks);
    const actions = TestBed.inject(TaskActions);
    const confirmDelete = vi.spyOn(actions, 'confirmDelete').mockImplementation(() => undefined);
    const open = mockTaskDialog({ success: true });
    const reload = vi.spyOn(TestBed.inject(TaskStore), 'reload');
    await respondWithData(tasks);
    await settle();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Edit Design homepage"] button, button[aria-label="Edit Design homepage"]',
      ) as HTMLElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Delete Design homepage"] button, button[aria-label="Delete Design homepage"]',
      ) as HTMLElement
    ).click();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="View Design homepage"] button, button[aria-label="View Design homepage"]',
      ) as HTMLElement
    ).click();

    const calls = open.mock.calls.map((call) => call[1]?.header);
    expect(calls).toEqual(['Edit Task', 'View Task']);
    expect(reload).toHaveBeenCalledTimes(2);

    (
      fixture.nativeElement.querySelector('.d-flex p-button button, .d-flex button') as HTMLElement
    ).click();
    expect(open).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ header: 'New Task' }),
    );
    expect(confirmDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-001' }));
  });

  it('shows an error state', async () => {
    const fixture = TestBed.createComponent(Tasks);
    await respondWithError('api/tasks');
    await settle();

    expect(fixture.nativeElement.textContent).toContain("Couldn't load tasks");
  });
});

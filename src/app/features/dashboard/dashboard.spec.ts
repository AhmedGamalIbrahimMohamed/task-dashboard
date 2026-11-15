import { MenuItem } from 'primeng/api';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import {
  provideAppTesting,
  respond,
  respondWithData,
  mockTaskDialog,
  respondWithError,
  settle,
} from '../../../testing/http-testing';
import { daysFromNow, makeTask } from '../../../testing/task-factory';
import { Statistic, Task, TaskStatus } from '../../core/models';
import { TaskFormDialog } from '../tasks/components/task-form-dialog/task-form-dialog';
import { TaskStore } from '../../core/store/task-store';
import { FilterBar } from './components/filter-bar/filter-bar';
import { TaskBoard } from './components/task-board/task-board';
import { Dashboard } from './dashboard';

const tasks: Task[] = [
  makeTask({ id: 'task-001', status: 'todo', title: 'Design homepage' }),
  makeTask({ id: 'task-002', status: 'in_progress', title: 'Build API' }),
  makeTask({ id: 'task-003', status: 'done', title: 'Fix login', completedAt: '2026-01-01' }),
  makeTask({ id: 'task-004', status: 'todo', title: 'Budget', dueDate: daysFromNow(-1) }),
];

const statistics: Statistic[] = [
  {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: 156,
    change: '+12',
    changeLabel: 'this week',
    changeType: 'positive',
    color: '',
  },
  {
    id: 'stat-004',
    title: 'Overdue',
    icon: '⚠️',
    value: 25,
    change: '+3',
    changeLabel: 'today',
    changeType: 'negative',
    color: '',
  },
  {
    id: 'stat-999',
    title: 'Other',
    icon: '',
    value: 7,
    change: '0',
    changeLabel: '',
    changeType: 'neutral',
    color: '',
  },
];

describe('dashboard feature', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppTesting() });
  });

  describe('FilterBar', () => {
    it('marks the active tab and emits changes', async () => {
      const fixture = TestBed.createComponent(FilterBar);
      fixture.componentRef.setInput('status', 'todo');
      const status = vi.fn();
      const newTask = vi.fn();
      fixture.componentInstance.statusChange.subscribe(status);
      fixture.componentInstance.newTask.subscribe(newTask);
      await settle();

      const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');

      tabs[3].click();
      (fixture.nativeElement.querySelector('.filter-bar__new') as HTMLElement).click();

      expect(status).toHaveBeenCalledWith('done');
      expect(newTask).toHaveBeenCalled();
    });
  });

  describe('FilterBar priority menu', () => {
    it('shows the selected priority and emits menu choices', async () => {
      const fixture = TestBed.createComponent(FilterBar);
      fixture.componentRef.setInput('status', 'all');
      const priority = vi.fn();
      fixture.componentInstance.priorityChange.subscribe(priority);
      await settle();

      const button = fixture.nativeElement.querySelector('.filter-bar__priority') as HTMLElement;
      expect(button.textContent?.trim()).toBe('Priority ▾');

      fixture.componentRef.setInput('priority', 'high');
      await settle();
      expect(button.textContent?.trim()).toBe('High ▾');

      const items: MenuItem[] = fixture.componentInstance['priorityItems']();
      expect(items[1].styleClass).toBe('fw-semibold');
      items[0].command?.({});
      items[3].command?.({});
      expect(priority).toHaveBeenNthCalledWith(1, null);
      expect(priority).toHaveBeenNthCalledWith(2, 'low');
    });
  });

  describe('TaskBoard', () => {
    function drop(
      board: TaskBoard,
      options: { from: TaskStatus; to: TaskStatus; previous: number; current: number },
    ) {
      board.onDrop({
        item: { data: tasks[0] },
        container: { data: options.to },
        previousContainer: { data: options.from },
        previousIndex: options.previous,
        currentIndex: options.current,
      } as unknown as CdkDragDrop<TaskStatus, TaskStatus, Task>);
    }

    it('groups tasks into the visible columns', async () => {
      const fixture = TestBed.createComponent(TaskBoard);
      fixture.componentRef.setInput('tasks', tasks);
      await settle();

      const columns = fixture.nativeElement.querySelectorAll('.board-column');
      expect(columns).toHaveLength(3);
      expect(columns[0].querySelectorAll('app-task-card')).toHaveLength(2);

      fixture.componentRef.setInput('statuses', ['done']);
      fixture.componentRef.setInput('tasks', []);
      await settle();
      expect(fixture.nativeElement.querySelectorAll('.board-column')).toHaveLength(1);
      expect(fixture.nativeElement.textContent).toContain('No tasks here');
    });

    it('emits a move only when the position changes', () => {
      const fixture = TestBed.createComponent(TaskBoard);
      const move = vi.fn();
      fixture.componentInstance.move.subscribe(move);
      const board = fixture.componentInstance;

      const sameContainer = { data: 'todo' };
      board.onDrop({
        item: { data: tasks[0] },
        container: sameContainer,
        previousContainer: sameContainer,
        previousIndex: 1,
        currentIndex: 1,
      } as unknown as CdkDragDrop<TaskStatus, TaskStatus, Task>);
      expect(move).not.toHaveBeenCalled();

      drop(board, { from: 'todo', to: 'done', previous: 0, current: 2 });
      expect(move).toHaveBeenCalledWith({ task: tasks[0], status: 'done', index: 2 });
    });
  });

  describe('Dashboard page', () => {
    it('shows skeletons while loading, then stats and board', async () => {
      const fixture = TestBed.createComponent(Dashboard);
      await settle();
      expect(fixture.nativeElement.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

      await respondWithData(tasks, statistics);
      await settle();

      const values = [...fixture.nativeElement.querySelectorAll('.stat-card__value')].map(
        (element: Element) => element.textContent,
      );
      expect(values).toEqual(['4', '1', '7']);
      expect(fixture.nativeElement.querySelectorAll('app-task-card')).toHaveLength(4);
    });

    it('filters the board by status from the filter bar', async () => {
      const fixture = TestBed.createComponent(Dashboard);
      await respondWithData(tasks, statistics);
      await settle();

      (fixture.nativeElement.querySelectorAll('[role="tab"]')[2] as HTMLElement).click();
      await settle();

      expect(fixture.nativeElement.querySelectorAll('.board-column')).toHaveLength(1);
      expect(fixture.nativeElement.querySelectorAll('app-task-card')).toHaveLength(1);
    });

    it('opens the add dialog and reloads tasks when it closes with success', async () => {
      const fixture = TestBed.createComponent(Dashboard);
      const reload = vi.spyOn(TestBed.inject(TaskStore), 'reload');
      const open = mockTaskDialog({ success: true });
      await respondWithData(tasks, statistics);
      await settle();

      (fixture.nativeElement.querySelector('.filter-bar__new') as HTMLElement).click();

      expect(open).toHaveBeenCalledWith(
        TaskFormDialog,
        expect.objectContaining({
          header: 'New Task',
          data: { task: undefined, viewOnly: false },
          modal: true,
          closable: true,
          dismissableMask: false,
          style: { width: '100%', maxWidth: '600px' },
        }),
      );
      expect(reload).toHaveBeenCalled();
    });

    it('does not reload when the dialog is cancelled', () => {
      const fixture = TestBed.createComponent(Dashboard);
      const reload = vi.spyOn(TestBed.inject(TaskStore), 'reload');
      const open = mockTaskDialog(undefined);

      fixture.componentInstance.openDialog(tasks[0], true);

      expect(open).toHaveBeenCalledWith(
        TaskFormDialog,
        expect.objectContaining({ header: 'View Task', data: { task: tasks[0], viewOnly: true } }),
      );
      expect(reload).not.toHaveBeenCalled();

      fixture.componentInstance.openDialog(tasks[0]);
      expect(open).toHaveBeenLastCalledWith(
        TaskFormDialog,
        expect.objectContaining({ header: 'Edit Task' }),
      );
    });

    it('shows an error state with retry', async () => {
      const fixture = TestBed.createComponent(Dashboard);
      const reload = vi.spyOn(TestBed.inject(TaskStore), 'reload');
      await respond('api/statistics', statistics);
      await respondWithError('api/tasks');
      await settle();

      expect(fixture.nativeElement.textContent).toContain("Couldn't load tasks");
      (fixture.nativeElement.querySelector('app-empty-state button') as HTMLElement).click();

      expect(reload).toHaveBeenCalled();
    });
  });
});

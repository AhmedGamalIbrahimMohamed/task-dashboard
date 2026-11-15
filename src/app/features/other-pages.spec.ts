import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  mockTaskDialog,
  provideAppTesting,
  respondWithData,
  settle,
} from '../../testing/http-testing';
import { daysFromNow, makeTask, USERS } from '../../testing/task-factory';
import { TaskFormDialog } from './tasks/components/task-form-dialog/task-form-dialog';
import { TaskStore } from '../core/store/task-store';
import { Analytics } from './analytics/analytics';
import { ActivityFeed } from './analytics/components/activity-feed/activity-feed';
import { TaskCharts } from './analytics/components/task-charts/task-charts';
import { Calendar } from './calendar/calendar';
import { Team } from './team/team';

describe('secondary pages', () => {
  const tasks = [
    makeTask({ id: 'task-001', priority: 'high', status: 'todo', dueDate: daysFromNow(1) }),
    makeTask({ id: 'task-002', priority: 'high', status: 'todo', dueDate: daysFromNow(1) }),
    makeTask({
      id: 'task-003',
      priority: 'low',
      status: 'in_progress',
      dueDate: daysFromNow(-2),
      assignee: USERS[1],
    }),
    makeTask({ id: 'task-004', priority: 'medium', status: 'done', completedAt: '2026-01-02' }),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppTesting() });
  });

  it('counts tasks for the charts', () => {
    const fixture = TestBed.createComponent(TaskCharts);
    fixture.componentRef.setInput('tasks', tasks);

    expect(fixture.componentInstance['priorityData']().datasets[0].data).toEqual([2, 1, 1]);
    expect(fixture.componentInstance['statusData']().datasets[0].data).toEqual([2, 1, 1]);
  });

  it('renders the activity feed', async () => {
    const fixture = TestBed.createComponent(ActivityFeed);
    fixture.componentRef.setInput('activities', [
      {
        id: '1',
        type: 'deleted',
        taskTitle: 'Old task',
        userName: 'John Doe',
        date: '2026-01-01T10:00:00Z',
      },
    ]);
    await settle();
    expect(fixture.nativeElement.textContent).toContain('John Doe deleted "Old task"');

    fixture.componentRef.setInput('activities', []);
    await settle();
    expect(fixture.nativeElement.textContent).toContain('No recent activity.');
  });

  it('renders analytics from the store', async () => {
    const fixture = TestBed.createComponent(Analytics);
    await respondWithData(tasks);
    await settle();

    expect(fixture.nativeElement.querySelectorAll('p-chart')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.feed__item')).toHaveLength(4);
  });

  it('summarizes the team and links to their tasks', async () => {
    const fixture = TestBed.createComponent(Team);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await settle();
    expect(fixture.nativeElement.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

    await respondWithData(tasks);
    await settle();

    const cards = fixture.nativeElement.querySelectorAll('.member');
    expect(cards).toHaveLength(2);
    expect(cards[1].textContent).toContain('Sarah Smith');
    expect([...cards[1].querySelectorAll('dd')].map((dd: Element) => dd.textContent)).toEqual([
      '1',
      '0',
      '1',
    ]);

    (cards[1].querySelector('button') as HTMLElement).click();
    expect(TestBed.inject(TaskStore).filters().assigneeId).toBe(USERS[1].id);
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('groups open tasks by due date in the calendar', async () => {
    const fixture = TestBed.createComponent(Calendar);
    await respondWithData(tasks);
    await settle();

    const days = fixture.nativeElement.querySelectorAll('.timeline__day');
    expect(days).toHaveLength(2);
    expect(days[0].classList).toContain('timeline__day--overdue');
    expect(days[1].querySelectorAll('.timeline__task')).toHaveLength(2);

    const open = mockTaskDialog({ success: false });
    const reload = vi.spyOn(TestBed.inject(TaskStore), 'reload');
    (days[1].querySelector('.timeline__task') as HTMLElement).click();
    expect(open).toHaveBeenCalledWith(
      TaskFormDialog,
      expect.objectContaining({
        data: { task: expect.objectContaining({ id: 'task-001' }), viewOnly: true },
      }),
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it('shows an empty calendar when everything is done', async () => {
    const fixture = TestBed.createComponent(Calendar);
    await respondWithData([tasks[3]]);
    await settle();

    expect(fixture.nativeElement.textContent).toContain('All caught up');
  });
});

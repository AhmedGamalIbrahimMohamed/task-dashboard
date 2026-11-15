import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';
import { provideAppTesting, settle } from '../../../../testing/http-testing';
import { daysFromNow, makeTask } from '../../../../testing/task-factory';
import { Task } from '../../../core/models';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  let fixture: ComponentFixture<TaskCard>;

  async function render(task: Task) {
    fixture.componentRef.setInput('task', task);
    await settle();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppTesting() });
    fixture = TestBed.createComponent(TaskCard);
  });

  it('renders task details', async () => {
    const host = await render(makeTask({ tags: ['Design', 'UI'] }));

    expect(host.querySelector('.task-card__title')?.textContent).toBe('Design homepage');
    expect(host.querySelector('.task-card__meta')?.textContent).toContain('Due in 2 days');
    expect(host.querySelector('.task-card__tags')?.textContent).toBe('Design, UI');
    expect(host.querySelector('.task-card__footer')?.textContent).toContain('@John');
    expect(host.classList).toContain('status-todo');
    expect(host.querySelector('.task-card__due img')?.getAttribute('src')).toBe(
      'icons/calendar.png',
    );
  });

  it('highlights overdue tasks', async () => {
    const host = await render(makeTask({ dueDate: daysFromNow(-2) }));

    expect(host.classList).toContain('overdue');
    expect(host.querySelector('.task-card__due img')?.getAttribute('src')).toBe(
      'icons/warning.png',
    );
    expect(host.querySelector('.task-card__due')?.textContent).toContain('Overdue by 2 days');
  });

  it('shows the completion state for done tasks', async () => {
    const host = await render(
      makeTask({ status: 'done', completedAt: new Date().toISOString(), description: '' }),
    );

    expect(host.querySelector('.task-card__due img')?.getAttribute('src')).toBe('icons/check.png');
    expect(host.querySelector('.task-card__due')?.textContent).toContain('Completed today');
    expect(host.querySelector('.task-card__description')).toBeNull();
  });

  it('emits view, edit and remove from the actions menu', async () => {
    const task = makeTask();
    await render(task);
    const view = vi.fn();
    const edit = vi.fn();
    const remove = vi.fn();
    fixture.componentInstance.view.subscribe(view);
    fixture.componentInstance.edit.subscribe(edit);
    fixture.componentInstance.remove.subscribe(remove);

    const items: MenuItem[] = fixture.componentInstance['menuItems']();
    expect(items.map((item) => item.label)).toEqual(['View', 'Edit', 'Delete']);
    items[0].command?.({});
    items[1].command?.({});
    items[2].command?.({});

    expect(view).toHaveBeenCalledWith(task);
    expect(edit).toHaveBeenCalledWith(task);
    expect(remove).toHaveBeenCalledWith(task);
  });
});

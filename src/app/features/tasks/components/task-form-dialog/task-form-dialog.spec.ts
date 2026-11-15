import { TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, of } from 'rxjs';
import { provideAppTesting, respond, settle } from '../../../../../testing/http-testing';
import { daysFromNow, makeTask, USERS } from '../../../../../testing/task-factory';
import { Task } from '../../../../core/models';
import { parseDateKey } from '../../../../core/utils/date';
import { TaskActions } from '../../task-actions';
import { MAX_TAGS, TaskDialogData, TaskFormDialog } from './task-form-dialog';

describe('TaskFormDialog', () => {
  const ref = { close: vi.fn() };
  const actions = { save: vi.fn() };

  async function render(data: TaskDialogData = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideAppTesting(),
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: { data } },
        { provide: TaskActions, useValue: actions },
      ],
    });
    const fixture = TestBed.createComponent(TaskFormDialog);
    await respond('api/users', USERS);
    await settle();
    return { fixture, component: fixture.componentInstance };
  }

  function saveButton(element: HTMLElement): HTMLButtonElement {
    return element.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts empty with the save button disabled', async () => {
    const { fixture, component } = await render();

    expect(component.form.getRawValue()).toEqual(
      expect.objectContaining({ title: '', status: 'todo', priority: 'medium', dueDate: null }),
    );
    expect(saveButton(fixture.nativeElement).disabled).toBe(true);
    expect(saveButton(fixture.nativeElement).textContent).toContain('Create task');
  });

  it('shows red asterisks only on required fields', async () => {
    const { fixture } = await render();
    const required = [...fixture.nativeElement.querySelectorAll('.task-form__required')].map(
      (star: Element) => star.closest('label')?.getAttribute('for'),
    );

    expect(required).toEqual(['task-title', 'task-due', 'task-assignee']);
  });

  it('enables the save button once all required fields are valid', async () => {
    const { fixture, component } = await render();

    component.form.patchValue({ title: 'Ship release', assigneeId: USERS[1].id });
    await settle();
    expect(saveButton(fixture.nativeElement).disabled).toBe(true);

    component.form.patchValue({ dueDate: parseDateKey(daysFromNow(3)) });
    await settle();
    expect(saveButton(fixture.nativeElement).disabled).toBe(false);
  });

  it('fills the form when editing a task', async () => {
    const task = makeTask({ tags: ['Design', 'UI'] });
    const { fixture, component } = await render({ task });

    expect(component.form.controls.title.value).toBe(task.title);
    expect(component.form.controls.assigneeId.value).toBe(task.assignee.id);
    expect(component.form.controls.dueDate.value).toEqual(parseDateKey(task.dueDate));
    expect(component.tags.value).toEqual(['Design', 'UI']);
    expect(saveButton(fixture.nativeElement).textContent).toContain('Save changes');
  });

  it('shows a read only form in view mode', async () => {
    const { fixture, component } = await render({ task: makeTask(), viewOnly: true });

    expect(component.form.disabled).toBe(true);
    expect(component.tagInput.disabled).toBe(true);
    expect(saveButton(fixture.nativeElement)).toBeNull();
    expect(fixture.nativeElement.querySelector('#task-tag')).toBeNull();

    component.submit();
    (fixture.nativeElement.querySelector('.task-form__footer button') as HTMLElement).click();

    expect(actions.save).not.toHaveBeenCalled();
    expect(ref.close).toHaveBeenCalledWith();
  });

  it('shows validation messages and blocks invalid submits', async () => {
    const { component } = await render();

    component.form.controls.title.setValue('     ');
    component.submit();

    expect(actions.save).not.toHaveBeenCalled();
    expect(component.errorFor(component.form.controls.title)).toBe('Cannot be empty spaces only.');
    expect(component.errorFor(component.form.controls.assigneeId)).toBe('This field is required.');

    component.form.controls.title.setValue('ab');
    expect(component.errorFor(component.form.controls.title)).toBe(
      'Must be at least 3 characters.',
    );
    component.form.controls.description.setValue('x'.repeat(301));
    component.form.controls.description.markAsTouched();
    expect(component.errorFor(component.form.controls.description)).toBe(
      'Must be at most 300 characters.',
    );
  });

  it('only requires a future due date for new open tasks', async () => {
    const { component } = await render();
    const dueDate = component.form.controls.dueDate;
    dueDate.setValue(parseDateKey(daysFromNow(-1)));
    dueDate.markAsTouched();

    expect(component.errorFor(dueDate)).toBe('Due date cannot be in the past.');

    component.form.controls.status.setValue('done');
    expect(dueDate.valid).toBe(true);
  });

  it('allows past due dates when editing', async () => {
    const { component } = await render({ task: makeTask({ dueDate: daysFromNow(-3) }) });

    expect(component.form.valid).toBe(true);
  });

  it('adds and removes tags with limits and duplicates check', async () => {
    const { component } = await render();

    component.tagInput.setValue('  ');
    component.addTag();
    expect(component.tags.length).toBe(0);

    component.tagInput.setValue('QA');
    component.addTag(new KeyboardEvent('keydown'));
    component.tagInput.setValue('qa');
    component.addTag();
    expect(component.errorFor(component.tags)).toBe('Tags must be unique.');

    component.removeTag(1);
    expect(component.tags.value).toEqual(['QA']);

    for (let index = 0; index < MAX_TAGS + 2; index++) {
      component.tagInput.setValue(`tag-${index}`);
      component.addTag();
    }
    expect(component.tags.length).toBe(MAX_TAGS);
  });

  it('saves a trimmed draft and closes the dialog', async () => {
    const saved = makeTask({ id: 'task-099' });
    actions.save.mockReturnValue(of(saved));
    const { component } = await render();

    component.form.patchValue({
      title: '  Ship release ',
      description: ' Notes ',
      priority: 'high',
      dueDate: parseDateKey(daysFromNow(3)),
      assigneeId: USERS[1].id,
    });
    component.submit();

    expect(actions.save).toHaveBeenCalledWith(undefined, {
      title: 'Ship release',
      description: 'Notes',
      status: 'todo',
      priority: 'high',
      dueDate: daysFromNow(3),
      assignee: USERS[1],
      tags: [],
    });
    expect(ref.close).toHaveBeenCalledWith({ success: true, task: saved });
  });

  it('keeps the dialog open and ignores double submits while saving', async () => {
    const response = new Subject<Task>();
    actions.save.mockReturnValue(response);
    const task = makeTask({ assignee: { ...USERS[0], id: 'user-404' } });
    const { component } = await render({ task });

    component.submit();
    component.submit();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledWith(
      task,
      expect.objectContaining({ assignee: task.assignee }),
    );

    response.error(new Error('failed'));
    expect(ref.close).not.toHaveBeenCalled();
    expect(component['saving']()).toBe(false);
  });

  it('closes without saving on cancel', async () => {
    const { fixture } = await render();

    (fixture.nativeElement.querySelector('.task-form__footer button') as HTMLElement).click();

    expect(ref.close).toHaveBeenCalledWith();
  });

  it('returns a generic message for unknown errors', async () => {
    const { component } = await render();
    const control = component.form.controls.title;
    control.setErrors({ custom: true });
    control.markAsTouched();

    expect(component.errorFor(control)).toBe('Invalid value.');
  });
});

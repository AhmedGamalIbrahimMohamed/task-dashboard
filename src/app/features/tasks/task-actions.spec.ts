import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { makeTask, toDraft } from '../../../testing/task-factory';
import { TaskStore } from '../../core/store/task-store';
import { TaskActions } from './task-actions';

describe('TaskActions', () => {
  const task = makeTask();
  const draft = toDraft(task);
  const store = { create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const confirmation = { confirm: vi.fn() };
  const messages = { add: vi.fn() };
  let actions: TaskActions;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: TaskStore, useValue: store },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: MessageService, useValue: messages },
      ],
    });
    actions = TestBed.inject(TaskActions);
  });

  it('creates a task and shows a toast', () => {
    store.create.mockReturnValue(of(task));

    actions.save(undefined, draft).subscribe();

    expect(store.create).toHaveBeenCalledWith(draft);
    expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Task created' }));
  });

  it('updates a task and shows a toast', () => {
    store.update.mockReturnValue(of(task));

    actions.save(task, draft).subscribe();

    expect(store.update).toHaveBeenCalledWith(task, draft);
    expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Task updated' }));
  });

  it('does not show a toast when saving fails', () => {
    store.create.mockReturnValue(throwError(() => new Error('failed')));

    actions.save(undefined, draft).subscribe({ error: () => undefined });

    expect(messages.add).not.toHaveBeenCalled();
  });

  it('asks for confirmation before deleting', () => {
    store.delete.mockReturnValue(of(null));

    actions.confirmDelete(task);
    const options = confirmation.confirm.mock.calls[0][0] as Confirmation;
    expect(store.delete).not.toHaveBeenCalled();

    options.accept?.();
    expect(store.delete).toHaveBeenCalledWith(task);
    expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Task deleted' }));
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { makeTask } from '../../../testing/task-factory';
import { TaskApi } from './task-api';

describe('TaskApi', () => {
  let api: TaskApi;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TaskApi);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('creates a task', () => {
    const { id, ...task } = makeTask();
    const result = vi.fn();
    api.create(task).subscribe(result);

    const request = controller.expectOne('api/tasks');
    expect(request.request.method).toBe('POST');
    request.flush({ ...task, id });

    expect(result).toHaveBeenCalledWith(expect.objectContaining({ id }));
  });

  it('updates a task', () => {
    const task = makeTask();
    api.update(task).subscribe();

    const request = controller.expectOne(`api/tasks/${task.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(task);
    request.flush(task);
  });

  it('deletes a task', () => {
    api.delete('task-001').subscribe();

    const request = controller.expectOne('api/tasks/task-001');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { cacheInterceptor, clearHttpCache } from './cache-interceptor';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    clearHttpCache();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('serves repeated GET requests from the cache', () => {
    const results: unknown[] = [];
    http.get('api/tasks').subscribe((value) => results.push(value));
    controller.expectOne('api/tasks').flush([{ id: 'task-001' }]);

    http.get('api/tasks').subscribe((value) => results.push(value));
    controller.expectNone('api/tasks');

    expect(results).toEqual([[{ id: 'task-001' }], [{ id: 'task-001' }]]);
  });

  it('refetches after the cache entry expires', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    http.get('api/tasks').subscribe();
    controller.expectOne('api/tasks').flush([]);

    now.mockReturnValue(10 * 60 * 1000);
    http.get('api/tasks').subscribe();
    controller.expectOne('api/tasks').flush([]);
    now.mockRestore();
  });

  it('invalidates the collection when a mutation happens', () => {
    http.get('api/tasks').subscribe();
    controller.expectOne('api/tasks').flush([]);

    http.put('api/tasks/task-001', {}).subscribe();
    controller.expectOne('api/tasks/task-001').flush({});

    http.get('api/tasks').subscribe();
    controller.expectOne('api/tasks').flush([]);
  });

  it('keeps unrelated collections cached after a mutation', () => {
    http.get('api/users').subscribe();
    controller.expectOne('api/users').flush([]);

    http.delete('api/tasks/task-001').subscribe();
    controller.expectOne('api/tasks/task-001').flush(null);

    http.get('api/users').subscribe();
    controller.expectNone('api/users');
  });
});

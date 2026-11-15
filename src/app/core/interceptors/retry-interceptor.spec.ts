import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RETRY_COUNT, RETRY_DELAY, retryInterceptor } from './retry-interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('retries failed GET requests on server errors', () => {
    const result = vi.fn();
    http.get('api/tasks').subscribe(result);

    controller.expectOne('api/tasks').flush(null, { status: 500, statusText: 'Server Error' });
    vi.advanceTimersByTime(RETRY_DELAY);
    controller.expectOne('api/tasks').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(RETRY_DELAY * 2);
    controller.expectOne('api/tasks').flush(['ok']);

    expect(result).toHaveBeenCalledWith(['ok']);
  });

  it('gives up after the retry limit', () => {
    const error = vi.fn();
    http.get('api/tasks').subscribe({ error });

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
      controller.expectOne('api/tasks').flush(null, { status: 500, statusText: 'Server Error' });
      vi.advanceTimersByTime(RETRY_DELAY * (attempt + 1));
    }

    expect(error).toHaveBeenCalledOnce();
  });

  it('does not retry client errors', () => {
    const error = vi.fn();
    http.get('api/tasks/missing').subscribe({ error });

    controller.expectOne('api/tasks/missing').flush(null, { status: 404, statusText: 'Not Found' });

    expect(error).toHaveBeenCalledOnce();
  });

  it('does not retry mutations', () => {
    const error = vi.fn();
    http.post('api/tasks', {}).subscribe({ error });

    controller.expectOne('api/tasks').flush(null, { status: 500, statusText: 'Server Error' });

    expect(error).toHaveBeenCalledOnce();
  });
});

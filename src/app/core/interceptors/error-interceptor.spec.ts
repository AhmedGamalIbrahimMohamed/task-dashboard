import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { I18n } from '../i18n/i18n';
import { errorInterceptor, errorMessage } from './error-interceptor';

describe('errorInterceptor', () => {
  it('shows a toast and rethrows the error', () => {
    const messages = { add: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: messages },
      ],
    });
    const error = vi.fn();

    TestBed.inject(HttpClient).get('api/tasks').subscribe({ error });
    TestBed.inject(HttpTestingController)
      .expectOne('api/tasks')
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(messages.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Request failed' }),
    );
    expect(error).toHaveBeenCalledOnce();
  });

  it.each([
    [0, 'Unable to reach the server. Check your connection.'],
    [404, 'The requested item was not found.'],
    [500, 'Something went wrong on the server. Please try again.'],
  ])('maps status %s to a friendly message', (status, message) => {
    expect(errorMessage(new HttpErrorResponse({ status }), TestBed.inject(I18n))).toBe(message);
  });

  it('falls back to the server message', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'Invalid title' } });
    expect(errorMessage(error, TestBed.inject(I18n))).toBe('Invalid title');
  });

  it('uses a generic message when the server sends none', () => {
    const error = new HttpErrorResponse({ status: 400 });
    expect(errorMessage(error, TestBed.inject(I18n))).toBe('Unexpected error.');
  });
});

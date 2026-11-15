import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

export const RETRY_COUNT = 2;
export const RETRY_DELAY = 500;

function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

/**
 * Retry GET 2 times (wait 500ms then 1000ms).
 * Only for no connection (0) or server errors (5xx).
 * We don't retry POST / PUT / DELETE so we don't save twice.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  return next(req).pipe(
    retry({
      count: RETRY_COUNT,
      delay: (error, attempt) =>
        isRetryable(error) ? timer(RETRY_DELAY * attempt) : throwError(() => error),
    }),
  );
};

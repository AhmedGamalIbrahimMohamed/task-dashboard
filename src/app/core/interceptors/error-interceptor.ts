import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { I18n } from '../i18n/i18n';

export function errorMessage(error: HttpErrorResponse, i18n: I18n): string {
  if (error.status === 0) return i18n.t('http.offline');
  if (error.status === 404) return i18n.t('http.notFound');
  if (error.status >= 500) return i18n.t('http.server');
  return error.error?.message ?? i18n.t('http.unexpected');
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService);
  const i18n = inject(I18n);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        messages.add({
          severity: 'error',
          summary: i18n.t('toast.requestFailed'),
          detail: errorMessage(error, i18n),
        });
      }
      return throwError(() => error);
    }),
  );
};

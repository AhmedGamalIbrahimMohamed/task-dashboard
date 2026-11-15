import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function clearHttpCache(): void {
  cache.clear();
}

/**
 * api/tasks/task-001 -> api/tasks
 */
function resourceKey(url: string): string {
  return url.replace(/\/[^/]+-\d+$/, '');
}

/**
 * Keeps GET responses in memory for cacheTtl ms.
 * POST / PUT / DELETE clears the cache of the same list only,
 * so next GET brings new data.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    const key = resourceKey(req.url);
    for (const url of cache.keys()) {
      if (url.startsWith(key)) cache.delete(url);
    }
    return next(req);
  }

  const cached = cache.get(req.urlWithParams);
  if (cached && cached.expiresAt > Date.now()) {
    return of(cached.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(req.urlWithParams, {
          response: event.clone(),
          expiresAt: Date.now() + environment.cacheTtl,
        });
      }
    }),
  );
};

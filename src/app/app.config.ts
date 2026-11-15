import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeAr from '@angular/common/locales/ar';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { InMemoryData } from './core/api/in-memory-data';
import { TranslatedTitleStrategy } from './core/i18n/title-strategy';
import { cacheInterceptor } from './core/interceptors/cache-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { retryInterceptor } from './core/interceptors/retry-interceptor';
import { AppTheme } from './core/theme';

registerLocaleData(localeAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([errorInterceptor, cacheInterceptor, retryInterceptor])),
    importProvidersFrom(
      HttpClientInMemoryWebApiModule.forRoot(InMemoryData, {
        delay: environment.apiDelay,
        post204: false,
        put204: false,
      }),
    ),
    providePrimeNG({ theme: { preset: AppTheme, options: { darkModeSelector: false } } }),
    MessageService,
    ConfirmationService,
    DialogService,
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
  ],
};

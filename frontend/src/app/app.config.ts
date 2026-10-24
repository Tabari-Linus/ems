import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { APOLLO_ERROR_HANDLER, provideAppApollo } from './core/apollo/apollo.config';
import { AuthService } from './core/services/auth.service';
import { SessionStore } from './core/services/session.store';

/**
 * Root providers. `APP_CONFIG` is not listed here: `main.ts` adds it after loading
 * `/config.json`, before bootstrap (tests provide it directly).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppApollo(),
    {
      // A permission error may mean the access level changed: re-read `me` (docs/api/auth.md §6).
      provide: APOLLO_ERROR_HANDLER,
      useFactory: () => {
        const session = inject(SessionStore);
        return (errors: readonly { code: string }[], operationName: string) => {
          if (isDevMode()) console.warn(`[EMS] GraphQL ${operationName} failed`, errors);
          if (operationName !== 'Me' && errors.some((e) => e.code === 'FORBIDDEN')) {
            void session.load().catch(() => undefined);
          }
        };
      },
    },
    // Restore the session from the refresh cookie before the first navigation runs the guards.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};

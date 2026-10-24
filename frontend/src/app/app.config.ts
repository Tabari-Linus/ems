import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideAppApollo } from './core/apollo/apollo.config';
import { provideSessionAwareErrorHandler } from './core/apollo/session-error-handler';
import { AuthService } from './core/services/auth.service';

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
    // Re-reads `me` on a FORBIDDEN error (docs/api/auth.md §6).
    provideSessionAwareErrorHandler(),
    // Restore the session from the refresh cookie before the first navigation runs the guards.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};

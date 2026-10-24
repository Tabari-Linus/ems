import { Injector, Provider, inject, isDevMode } from '@angular/core';
import { SessionStore } from '../services/session.store';
import { APOLLO_ERROR_HANDLER, type ApolloErrorHandler } from './apollo.config';

/**
 * Logs GraphQL failures in development and, on a FORBIDDEN error, re-reads `me`: the access
 * level may have changed since sign-in (docs/api/auth.md §6). Runs in an injection context.
 */
export function sessionAwareErrorHandler(): ApolloErrorHandler {
  // Resolved lazily: SessionStore needs Apollo, and Apollo needs this handler.
  const injector = inject(Injector);
  return (errors, operationName) => {
    if (isDevMode()) console.warn(`[EMS] GraphQL ${operationName} failed`, errors);
    if (operationName !== 'Me' && errors.some((e) => e.code === 'FORBIDDEN')) {
      void injector
        .get(SessionStore)
        .load()
        .catch(() => undefined);
    }
  };
}

export function provideSessionAwareErrorHandler(): Provider {
  return { provide: APOLLO_ERROR_HANDLER, useFactory: sessionAwareErrorHandler };
}

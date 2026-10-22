import { HttpHeaders } from '@angular/common/http';
import { InjectionToken, Provider, inject, isDevMode } from '@angular/core';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client/core';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { APP_CONFIG } from '../config/app-config';
import { AppError } from '../errors/app-error';
import { toAppErrors } from '../errors/app-error.mapper';
import { TokenService } from '../services/token.service';

/** Receives every error that passes through the Apollo link chain, already mapped. */
export type ApolloErrorHandler = (errors: readonly AppError[], operationName: string) => void;

export const APOLLO_ERROR_HANDLER = new InjectionToken<ApolloErrorHandler>('APOLLO_ERROR_HANDLER', {
  providedIn: 'root',
  factory: () => (errors, operationName) => {
    if (isDevMode()) console.warn(`[EMS] GraphQL ${operationName} failed`, errors);
  },
});

/**
 * Sent on every GraphQL request so the browser always preflights it (CORS), which keeps
 * simple-request CSRF off `/graphql`. The backend allows this header explicitly.
 */
export const APOLLO_PREFLIGHT_HEADER = 'apollo-require-preflight';

export function graphqlEndpoint(apiUrl: string): string {
  return `${apiUrl}/graphql`;
}

/** Adds the bearer token and the preflight header to each operation's HTTP headers. */
export function createAuthLink(getToken: () => string): ApolloLink {
  return new SetContextLink((prevContext) => {
    const prev: unknown = prevContext['headers'];
    let headers =
      prev instanceof HttpHeaders
        ? prev
        : new HttpHeaders((prev as Record<string, string> | undefined) ?? {});
    headers = headers.set(APOLLO_PREFLIGHT_HEADER, 'true');
    const token = getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return { headers };
  });
}

/**
 * Maps GraphQL (`extensions.code`) and transport errors to `AppError` and reports them.
 * The original error still reaches the caller; use `toAppError()` there for the typed form.
 * Slice 1 adds the single-flight token refresh + retry on `UNAUTHENTICATED` here.
 */
export function createErrorLink(handler: ApolloErrorHandler): ApolloLink {
  return new ErrorLink(({ error, operation }) => {
    handler(toAppErrors(error), operation.operationName ?? 'anonymous operation');
  });
}

/** Apollo client options; runs in an injection context (`provideApollo` factory). */
export function apolloOptionsFactory(): ApolloClient.Options {
  const httpLink = inject(HttpLink);
  const { apiUrl } = inject(APP_CONFIG);
  const tokenService = inject(TokenService);
  const errorHandler = inject(APOLLO_ERROR_HANDLER);

  return {
    link: ApolloLink.from([
      createErrorLink(errorHandler),
      createAuthLink(() => tokenService.get()),
      httpLink.create({ uri: graphqlEndpoint(apiUrl) }),
    ]),
    cache: new InMemoryCache(),
  };
}

export function provideAppApollo(): Provider {
  return provideApollo(apolloOptionsFactory);
}

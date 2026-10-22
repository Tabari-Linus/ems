import { HttpErrorResponse } from '@angular/common/http';
import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  ServerError,
  ServerParseError,
} from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';
import { AppError, AppErrorCode, FieldViolation, isServerErrorCode } from './app-error';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection and try again.';

/** Maps one GraphQL error (`errors[i]` of a response) to an `AppError` via `extensions.code`. */
export function graphQLErrorToAppError(error: GraphQLFormattedError): AppError {
  const extensions = error.extensions ?? {};
  const rawCode = extensions['code'];
  return {
    code: isServerErrorCode(rawCode) ? rawCode : 'UNKNOWN',
    message: error.message || GENERIC_MESSAGE,
    violations: parseViolations(extensions['violations']),
    ...(error.path ? { path: error.path } : {}),
  };
}

/**
 * Normalises anything thrown by Apollo, HttpClient or fetch into `AppError`s.
 * A GraphQL response can carry several errors, so this returns a non-empty list.
 */
export function toAppErrors(error: unknown): [AppError, ...AppError[]] {
  if (CombinedGraphQLErrors.is(error) || CombinedProtocolErrors.is(error)) {
    const [first, ...rest] = error.errors.map(graphQLErrorToAppError);
    if (first) return [first, ...rest];
    return [fallback('UNKNOWN', error.message)];
  }
  if (ServerError.is(error) || ServerParseError.is(error)) {
    return [fromHttpStatus(error.statusCode, error.message)];
  }
  if (error instanceof HttpErrorResponse) {
    const graphQLErrors = graphQLErrorsFromBody(error.error);
    if (graphQLErrors.length > 0) {
      return graphQLErrors.map(graphQLErrorToAppError) as [AppError, ...AppError[]];
    }
    return [fromHttpStatus(error.status, error.message)];
  }
  if (error instanceof TypeError) {
    // fetch() rejects with a TypeError when the network request itself fails.
    return [fallback('NETWORK_ERROR', NETWORK_MESSAGE)];
  }
  return [fallback('UNKNOWN', error instanceof Error ? error.message : GENERIC_MESSAGE)];
}

/** The primary error, for callers that show a single message. */
export function toAppError(error: unknown): AppError {
  return toAppErrors(error)[0];
}

function fromHttpStatus(status: number, message: string): AppError {
  return fallback(httpStatusToCode(status), status === 0 ? NETWORK_MESSAGE : message);
}

function httpStatusToCode(status: number): AppErrorCode {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 400) return 'INPUT_VALIDATION_ERROR';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'DUPLICATE_RECORD';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'UNKNOWN';
}

function fallback(code: AppErrorCode, message: string): AppError {
  return { code, message: message || GENERIC_MESSAGE, violations: [] };
}

function parseViolations(raw: unknown): FieldViolation[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return [];
    const { field, message } = item as Record<string, unknown>;
    return typeof field === 'string' && typeof message === 'string' ? [{ field, message }] : [];
  });
}

function graphQLErrorsFromBody(body: unknown): GraphQLFormattedError[] {
  if (typeof body !== 'object' || body === null) return [];
  const errors = (body as Record<string, unknown>)['errors'];
  if (!Array.isArray(errors)) return [];
  return errors.filter(
    (e: unknown): e is GraphQLFormattedError =>
      typeof e === 'object' && e !== null && typeof (e as { message?: unknown }).message === 'string',
  );
}

import { HttpErrorResponse } from '@angular/common/http';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { isServerErrorCode } from './app-error';
import { graphQLErrorToAppError, toAppError, toAppErrors } from './app-error.mapper';

describe('graphQLErrorToAppError', () => {
  it('reads extensions.code, message and path', () => {
    expect(
      graphQLErrorToAppError({
        message: 'Position not found',
        path: ['getPosition'],
        extensions: { code: 'NOT_FOUND', errorType: 'NOT_FOUND' },
      }),
    ).toEqual({
      code: 'NOT_FOUND',
      message: 'Position not found',
      violations: [],
      path: ['getPosition'],
    });
  });

  it('maps field violations and drops malformed entries', () => {
    const error = graphQLErrorToAppError({
      message: 'Validation failed',
      extensions: {
        code: 'VALIDATION_ERROR',
        violations: [
          { field: 'positionName', message: 'must not be blank' },
          { field: 42, message: 'bad field type' },
          'not an object',
          null,
        ],
      },
    });

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.violations).toEqual([{ field: 'positionName', message: 'must not be blank' }]);
  });

  it('falls back to UNKNOWN for a missing or unrecognised code', () => {
    expect(graphQLErrorToAppError({ message: 'x' }).code).toBe('UNKNOWN');
    expect(graphQLErrorToAppError({ message: 'x', extensions: { code: 'TEAPOT' } }).code).toBe(
      'UNKNOWN',
    );
  });

  it('never returns an empty message', () => {
    expect(graphQLErrorToAppError({ message: '' }).message).not.toBe('');
  });
});

describe('toAppErrors / toAppError', () => {
  it('maps every error of a CombinedGraphQLErrors', () => {
    const error = new CombinedGraphQLErrors({
      data: null,
      errors: [
        { message: 'Denied', extensions: { code: 'FORBIDDEN' } },
        { message: 'Gone', extensions: { code: 'NOT_FOUND' } },
      ],
    });

    expect(toAppErrors(error).map((e) => e.code)).toEqual(['FORBIDDEN', 'NOT_FOUND']);
    expect(toAppError(error).message).toBe('Denied');
  });

  it('maps an Apollo ServerError by HTTP status', () => {
    const error = new ServerError('Unauthorized', {
      response: new Response('', { status: 401 }),
      bodyText: '',
    });

    expect(toAppError(error).code).toBe('UNAUTHENTICATED');
  });

  it.each([
    [0, 'NETWORK_ERROR'],
    [400, 'INPUT_VALIDATION_ERROR'],
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'DUPLICATE_RECORD'],
    [503, 'INTERNAL_ERROR'],
    [418, 'UNKNOWN'],
  ] as const)('maps HttpErrorResponse status %i to %s', (status, code) => {
    expect(toAppError(new HttpErrorResponse({ status, statusText: 'x' })).code).toBe(code);
  });

  it('prefers GraphQL errors in an HttpErrorResponse body', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errors: [{ message: 'Bad sort', extensions: { code: 'INVALID_PROPERTY_REFERENCE' } }],
      },
    });

    expect(toAppError(error)).toMatchObject({
      code: 'INVALID_PROPERTY_REFERENCE',
      message: 'Bad sort',
    });
  });

  it('treats a fetch TypeError as a network error', () => {
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('NETWORK_ERROR');
  });

  it('maps anything else to UNKNOWN', () => {
    expect(toAppError(new Error('boom'))).toMatchObject({ code: 'UNKNOWN', message: 'boom' });
    expect(toAppError('a string').code).toBe('UNKNOWN');
  });
});

describe('isServerErrorCode', () => {
  it('recognises backend codes only', () => {
    expect(isServerErrorCode('UNAUTHENTICATED')).toBe(true);
    expect(isServerErrorCode('NETWORK_ERROR')).toBe(false);
    expect(isServerErrorCode(undefined)).toBe(false);
  });
});

/**
 * Error codes the UI understands. Mirrors the backend's `GraphQLErrorCode`
 * (`extensions.code`) plus client-side codes for transport failures.
 */
export const SERVER_ERROR_CODES = [
  'INPUT_VALIDATION_ERROR',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'BUSINESS_RULE_VIOLATION',
  'FORBIDDEN',
  'UNAUTHENTICATED',
  'INVALID_DATE_FORMAT',
  'INVALID_DATE_VALUE',
  'DUPLICATE_RECORD',
  'DATA_INTEGRITY_VIOLATION',
  'DATABASE_ERROR',
  'INVALID_PROPERTY_REFERENCE',
  'INTERNAL_ERROR',
] as const;

export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];

/** `NETWORK_ERROR`: no usable HTTP response. `UNKNOWN`: missing or unrecognised code. */
export type AppErrorCode = ServerErrorCode | 'NETWORK_ERROR' | 'UNKNOWN';

/** A field-level validation failure (`extensions.violations[]`). */
export interface FieldViolation {
  readonly field: string;
  readonly message: string;
}

/** The single error shape the UI consumes, whatever the transport produced. */
export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly violations: readonly FieldViolation[];
  /** GraphQL response path of the failing field, when known. */
  readonly path?: readonly (string | number)[];
}

export function isServerErrorCode(value: unknown): value is ServerErrorCode {
  return typeof value === 'string' && (SERVER_ERROR_CODES as readonly string[]).includes(value);
}

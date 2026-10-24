package com.mrlii.ems.auth.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Machine-readable {@code code} of every auth error body. See docs/api/auth.md. */
@Getter
public enum AuthErrorCode {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED(HttpStatus.LOCKED),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN),
    ACCOUNT_PENDING(HttpStatus.FORBIDDEN),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED),
    PASSWORD_POLICY(HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
    CSRF_REJECTED(HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN);

    private final HttpStatus status;

    AuthErrorCode(HttpStatus status) {
        this.status = status;
    }
}

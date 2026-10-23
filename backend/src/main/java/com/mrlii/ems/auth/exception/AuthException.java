package com.mrlii.ems.auth.exception;

import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * Any failure of an auth endpoint. Rendered as {@code {status, code, message, violations?}} by
 * {@code AuthExceptionHandler}. Messages are safe to show to the user.
 */
@Getter
public class AuthException extends RuntimeException {

    private final AuthErrorCode code;
    private final transient HttpStatus status;
    private final transient List<Violation> violations;

    public AuthException(AuthErrorCode code, String message) {
        this(code, code.getStatus(), message, List.of());
    }

    public AuthException(AuthErrorCode code, HttpStatus status, String message) {
        this(code, status, message, List.of());
    }

    public AuthException(AuthErrorCode code, HttpStatus status, String message, List<Violation> violations) {
        super(message);
        this.code = code;
        this.status = status;
        this.violations = List.copyOf(violations);
    }
}

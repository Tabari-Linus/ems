package com.mrlii.ems.auth.exception;

import com.mrlii.ems.auth.controller.AuthController;
import com.mrlii.ems.auth.dto.AuthErrorResponse;
import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Comparator;
import java.util.List;

/** Renders every auth endpoint error as {@code {status, code, message, violations?}}. */
@RestControllerAdvice(assignableTypes = AuthController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthExceptionHandler {

    @ExceptionHandler(RateLimitedException.class)
    public ResponseEntity<AuthErrorResponse> handleRateLimited(RateLimitedException ex) {
        return ResponseEntity.status(ex.getStatus())
                .header(HttpHeaders.RETRY_AFTER, Long.toString(ex.getRetryAfterSeconds()))
                .body(body(ex));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<AuthErrorResponse> handleAuth(AuthException ex) {
        return ResponseEntity.status(ex.getStatus()).body(body(ex));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthErrorResponse> handleInvalidBody(MethodArgumentNotValidException ex) {
        List<Violation> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(AuthExceptionHandler::violation)
                .sorted(Comparator.comparing(Violation::field).thenComparing(Violation::message))
                .toList();
        return badRequest("Validation failed", violations);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AuthErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return badRequest("Malformed request body", List.of());
    }

    private static ResponseEntity<AuthErrorResponse> badRequest(String message, List<Violation> violations) {
        return ResponseEntity.badRequest().body(new AuthErrorResponse(
                HttpStatus.BAD_REQUEST.value(), AuthErrorCode.VALIDATION_ERROR.name(), message, violations));
    }

    private static AuthErrorResponse body(AuthException ex) {
        return new AuthErrorResponse(ex.getStatus().value(), ex.getCode().name(), ex.getMessage(), ex.getViolations());
    }

    private static Violation violation(FieldError error) {
        return new Violation(error.getField(),
                error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage());
    }
}

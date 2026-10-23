package com.mrlii.ems.auth.exception;

import com.mrlii.ems.auth.dto.AuthErrorResponse;
import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuthExceptionHandlerTest {

    private final AuthExceptionHandler handler = new AuthExceptionHandler();

    @Test
    void authException_rendersStatusCodeMessage() {
        ResponseEntity<AuthErrorResponse> response = handler.handleAuth(
                new AuthException(AuthErrorCode.INVALID_CREDENTIALS, "Invalid email or password"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isEqualTo(
                new AuthErrorResponse(401, "INVALID_CREDENTIALS", "Invalid email or password", List.of()));
    }

    @Test
    void passwordPolicy_includesViolations() {
        AuthException ex = new AuthException(AuthErrorCode.PASSWORD_POLICY, HttpStatus.BAD_REQUEST, "policy",
                List.of(new Violation("newPassword", "too short")));

        AuthErrorResponse body = handler.handleAuth(ex).getBody();

        assertThat(body).isNotNull();
        assertThat(body.violations()).containsExactly(new Violation("newPassword", "too short"));
    }

    @Test
    void rateLimited_setsRetryAfter() {
        ResponseEntity<AuthErrorResponse> response = handler.handleRateLimited(new RateLimitedException(42));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("42");
        assertThat(response.getBody()).extracting(AuthErrorResponse::code).isEqualTo("RATE_LIMITED");
    }

    @Test
    void beanValidation_is400WithSortedViolations() throws NoSuchMethodException {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new FieldError("request", "password", "must not be blank"));
        result.addError(new FieldError("request", "email", null, false, null, null, null));
        MethodParameter parameter = new MethodParameter(
                AuthExceptionHandlerTest.class.getDeclaredMethod("beanValidation_is400WithSortedViolations"), -1);

        ResponseEntity<AuthErrorResponse> response =
                handler.handleInvalidBody(new MethodArgumentNotValidException(parameter, result));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().violations()).containsExactly(
                new Violation("email", "Invalid value"), new Violation("password", "must not be blank"));
    }

    @Test
    void unreadableBody_is400() {
        ResponseEntity<AuthErrorResponse> response = handler.handleUnreadableBody(
                new HttpMessageNotReadableException("bad json", new MockHttpInputMessage(new byte[0])));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).extracting(AuthErrorResponse::message).isEqualTo("Malformed request body");
    }
}

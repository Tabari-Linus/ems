package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;

/**
 * 401 for missing/invalid/expired bearer tokens and for accounts that may no longer be used.
 * Keeps the RFC 6750 {@code WWW-Authenticate} header and adds the JSON error body
 * ({@code UNAUTHENTICATED}, {@code TOKEN_INVALID}, {@code TOKEN_EXPIRED}, {@code ACCOUNT_*}).
 */
@Component
@RequiredArgsConstructor
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final AuthErrorResponseWriter errorWriter;
    private final BearerTokenAuthenticationEntryPoint headerWriter = new BearerTokenAuthenticationEntryPoint();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        headerWriter.commence(request, response, exception);
        errorWriter.write(response, HttpStatus.UNAUTHORIZED.value(), codeFor(exception), messageFor(exception));
    }

    static AuthErrorCode codeFor(AuthenticationException exception) {
        if (exception instanceof AccountAccessDeniedException denied) {
            return denied.getCode();
        }
        if (exception instanceof InvalidBearerTokenException) {
            String message = exception.getMessage() == null ? "" : exception.getMessage().toLowerCase(Locale.ROOT);
            return message.contains("expired") ? AuthErrorCode.TOKEN_EXPIRED : AuthErrorCode.TOKEN_INVALID;
        }
        return AuthErrorCode.UNAUTHENTICATED;
    }

    private static String messageFor(AuthenticationException exception) {
        return switch (codeFor(exception)) {
            case TOKEN_EXPIRED -> "The access token has expired";
            case TOKEN_INVALID -> exception instanceof AccountAccessDeniedException
                    ? exception.getMessage()
                    : "The access token is invalid";
            case UNAUTHENTICATED -> "Authentication is required";
            default -> exception.getMessage();
        };
    }
}

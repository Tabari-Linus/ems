package com.mrlii.ems.auth.controller;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.ChangePasswordRequest;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.dto.SetPasswordRequest;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.security.AccountAuthenticationToken;
import com.mrlii.ems.auth.security.AuthRateLimiter;
import com.mrlii.ems.auth.security.CurrentAccountProvider;
import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.config.AuthCookieProperties;
import com.mrlii.ems.common.dto.ClientInfo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;

/**
 * REST auth endpoints. The refresh token only travels in the {@code refresh_token} HttpOnly cookie
 * (path {@code /api/v1/auth}); the access token is returned in the body. Contract: docs/api/auth.md.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    public static final String COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final AuthCookieProperties cookieProperties;
    private final AuthRateLimiter rateLimiter;
    private final CurrentAccountProvider currentAccountProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request, HttpServletRequest http) {
        ClientInfo client = ClientInfo.from(http);
        rateLimiter.check(AuthRateLimiter.LOGIN, client.ip());
        return withSession(authService.login(request, client));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = COOKIE_NAME, required = false) String refreshToken, HttpServletRequest http) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AuthException(AuthErrorCode.TOKEN_INVALID, "No session. Please sign in.");
        }
        return withSession(authService.refresh(refreshToken, ClientInfo.from(http)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = COOKIE_NAME, required = false) String refreshToken, HttpServletRequest http) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken, ClientInfo.from(http));
        }
        return noContentClearingCookie();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(HttpServletRequest http) {
        authService.logoutAll(currentAccountProvider.requireAccount().accountId(), ClientInfo.from(http));
        return noContentClearingCookie();
    }

    @PostMapping("/set-password")
    public ResponseEntity<Void> setPassword(@RequestBody @Valid SetPasswordRequest request, HttpServletRequest http) {
        ClientInfo client = ClientInfo.from(http);
        rateLimiter.check(AuthRateLimiter.SET_PASSWORD, client.ip());
        authService.setPassword(request, client);
        return noContentClearingCookie();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request,
                                               HttpServletRequest http) {
        AccountAuthenticationToken authentication = currentAccountProvider.requireAuthentication();
        authService.changePassword(authentication.getAccount().accountId(), authentication.sessionFamilyId(),
                request, ClientInfo.from(http));
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<AuthResponse> withSession(AuthTokenPair pair) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(pair).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new AuthResponse(pair.accessToken(), pair.accessTokenExpiresAt()));
    }

    private ResponseEntity<Void> noContentClearingCookie() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    private ResponseCookie buildRefreshCookie(AuthTokenPair pair) {
        long maxAge = Math.max(0, Duration.between(Instant.now(), pair.refreshTokenExpiresAt()).getSeconds());
        return cookie(pair.refreshToken(), maxAge);
    }

    private ResponseCookie clearRefreshCookie() {
        return cookie("", 0);
    }

    private ResponseCookie cookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .path(cookieProperties.path())
                .maxAge(maxAgeSeconds)
                .build();
    }
}

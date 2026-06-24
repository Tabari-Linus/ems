package com.mrlii.ems.auth.controller;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.config.RsaKeyProperties;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final RsaKeyProperties rsaKeyProperties;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthTokenPair pair = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(pair).toString())
                .body(new AuthResponse(pair.accessToken(), pair.accessTokenExpiresAt()));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }
        AuthTokenPair pair = authService.refreshToken(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(pair).toString())
                .body(new AuthResponse(pair.accessToken(), pair.accessTokenExpiresAt()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    private ResponseCookie buildRefreshCookie(AuthTokenPair pair) {
        long maxAge = Duration.between(Instant.now(), pair.refreshTokenExpiresAt()).getSeconds();
        return ResponseCookie.from(COOKIE_NAME, pair.refreshToken())
                .httpOnly(true)
                .secure(rsaKeyProperties.cookieSecure())
                .sameSite("Strict")
                .path("/auth")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(rsaKeyProperties.cookieSecure())
                .sameSite("Strict")
                .path("/auth")
                .maxAge(0)
                .build();
    }
}

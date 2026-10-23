package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * Authentication settings under {@code app.auth}. The refresh cookie attributes live in
 * {@link AuthCookieProperties} ({@code app.auth.cookie}); token lifetimes in {@link RsaKeyProperties}.
 *
 * @param jwt                    issuer / audience written to and required on every access token
 * @param legacyPermissionsClaim transition flag: keep emitting the {@code permissions} and
 *                               {@code account_id} claims for the current frontend. Authorization
 *                               never reads them; switch off once the frontend uses the {@code me} query.
 * @param lockout                failed-login lockout
 * @param rateLimit              per-IP rate limit on {@code /login} and {@code /set-password}
 * @param tokens                 one-time token lifetimes
 * @param principalCacheTtl      how long a resolved principal (status + permissions) is cached
 */
@ConfigurationProperties("app.auth")
public record AuthProperties(
        @DefaultValue Jwt jwt,
        @DefaultValue("true") boolean legacyPermissionsClaim,
        @DefaultValue Lockout lockout,
        @DefaultValue RateLimit rateLimit,
        @DefaultValue Tokens tokens,
        @DefaultValue("60s") Duration principalCacheTtl
) {

    public record Jwt(
            @DefaultValue("ems-api") String issuer,
            @DefaultValue("ems-web") String audience
    ) {}

    public record Lockout(
            @DefaultValue("5") int maxFailedAttempts,
            @DefaultValue("15m") Duration duration
    ) {}

    public record RateLimit(
            @DefaultValue("10") int capacity,
            @DefaultValue("1m") Duration period
    ) {}

    public record Tokens(
            @DefaultValue("72h") Duration welcomeTtl,
            @DefaultValue("1h") Duration passwordResetTtl
    ) {}
}

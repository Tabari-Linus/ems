package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Attributes of the refresh-token cookie. Driven by {@code AUTH_COOKIE_SECURE},
 * {@code AUTH_COOKIE_SAMESITE} and {@code AUTH_COOKIE_PATH}.
 */
@ConfigurationProperties("app.auth.cookie")
public record AuthCookieProperties(
        @DefaultValue("false") boolean secure,
        @DefaultValue("Lax") String sameSite,
        @DefaultValue("/api/v1/auth") String path
    ) {}

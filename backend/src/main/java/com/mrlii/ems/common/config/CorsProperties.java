package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Allowed CORS origins, bound from the comma-separated {@code ALLOWED_ORIGINS} env var.
 */
@ConfigurationProperties("app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null
                ? List.of()
                : allowedOrigins.stream()
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .toList();
    }
}

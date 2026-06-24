package com.mrlii.ems.auth.dto;

import java.time.Instant;

public record AuthTokenPair(
        String accessToken,
        Instant accessTokenExpiresAt,
        String refreshToken,
        Instant refreshTokenExpiresAt
) {}

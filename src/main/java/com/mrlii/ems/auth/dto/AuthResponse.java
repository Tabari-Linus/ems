package com.mrlii.ems.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String accessToken,
        Instant expiresAt
) {}

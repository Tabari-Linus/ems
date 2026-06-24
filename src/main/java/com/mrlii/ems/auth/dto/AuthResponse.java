package com.mrlii.ems.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String token,
        Instant expiresAt
) {}

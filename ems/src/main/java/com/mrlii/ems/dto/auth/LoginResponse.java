package com.mrlii.ems.dto.auth;

import com.mrlii.ems.domain.enums.UserRole;

import java.util.UUID;

/**
 * Returned on successful login.
 * The refresh token is NOT included here — it is sent as an HttpOnly cookie by the server.
 */
public record LoginResponse(

        UUID userId,
        UUID employeeId,
        UserRole role,
        String accessToken,
        boolean mustChangePassword

) {}

package com.mrlii.ems.dto.profileupdate;

import com.mrlii.ems.domain.enums.ProfileUpdateStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ProfileUpdateRequestResponse(

        UUID id,
        UUID employeeId,
        String employeeFullName,
        ProfileUpdateStatus status,
        Map<String, Object> requestedChanges,
        String reviewedByUserEmail,
        Instant reviewedAt,
        String rejectionReason,
        Instant createdAt

) {}

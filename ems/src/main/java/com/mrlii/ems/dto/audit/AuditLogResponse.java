package com.mrlii.ems.dto.audit;

import com.mrlii.ems.domain.enums.AuditActionType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(

        UUID id,
        String actorEmail,
        AuditActionType actionType,
        String entityType,
        UUID entityId,
        Map<String, Object> oldValues,
        Map<String, Object> newValues,
        String ipAddress,
        Instant createdAt

) {}

package com.mrlii.ems.dto.notification;

import com.mrlii.ems.domain.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(

        UUID id,
        NotificationType type,
        String title,
        String message,
        String referenceEntityType,
        UUID referenceEntityId,
        boolean read,
        Instant readAt,
        Instant createdAt

) {}

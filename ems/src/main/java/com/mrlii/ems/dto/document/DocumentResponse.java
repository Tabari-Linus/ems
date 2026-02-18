package com.mrlii.ems.dto.document;

import com.mrlii.ems.domain.enums.DocumentStatus;
import com.mrlii.ems.domain.enums.DocumentType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DocumentResponse(

        UUID id,
        DocumentType documentType,
        String name,
        String fileUrl,
        Long fileSizeBytes,
        String mimeType,
        LocalDate expiryDate,
        boolean visibleToEmployee,
        DocumentStatus status,
        String uploadedByUserEmail,
        Instant createdAt,
        Instant updatedAt

) {}

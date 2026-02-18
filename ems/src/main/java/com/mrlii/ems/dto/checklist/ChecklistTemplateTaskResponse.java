package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.OwnerType;

import java.util.UUID;

public record ChecklistTemplateTaskResponse(

        UUID id,
        String title,
        String description,
        OwnerType assignedOwnerType,
        int dueDateOffsetDays,
        boolean mandatory,
        int sortOrder

) {}

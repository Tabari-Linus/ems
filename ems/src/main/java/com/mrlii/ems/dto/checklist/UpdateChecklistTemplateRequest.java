package com.mrlii.ems.dto.checklist;

import jakarta.validation.constraints.Size;

import java.util.UUID;

// Tasks are managed separately via their own endpoints
public record UpdateChecklistTemplateRequest(

        @Size(max = 150)
        String name,

        String description,

        UUID applicableEmploymentTypeId,

        UUID applicableDepartmentId,

        boolean active

) {}

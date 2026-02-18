package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.OwnerType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateChecklistTemplateTaskRequest(

        @NotBlank
        @Size(max = 200)
        String title,

        String description,

        @NotNull
        OwnerType assignedOwnerType,

        @Min(0)
        int dueDateOffsetDays,

        boolean mandatory,

        @Min(0)
        int sortOrder

) {}

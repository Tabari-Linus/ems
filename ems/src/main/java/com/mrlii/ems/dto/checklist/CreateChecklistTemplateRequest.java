package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.ChecklistType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateChecklistTemplateRequest(

        @NotBlank
        @Size(max = 150)
        String name,

        String description,

        @NotNull
        ChecklistType type,

        UUID applicableEmploymentTypeId,

        UUID applicableDepartmentId,

        @NotEmpty
        List<@Valid CreateChecklistTemplateTaskRequest> tasks

) {}

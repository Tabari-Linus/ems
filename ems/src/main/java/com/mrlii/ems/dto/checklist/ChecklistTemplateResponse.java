package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.ChecklistType;
import com.mrlii.ems.dto.department.DepartmentSummaryResponse;
import com.mrlii.ems.dto.employmenttype.EmploymentTypeResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChecklistTemplateResponse(

        UUID id,
        String name,
        String description,
        ChecklistType type,
        EmploymentTypeResponse applicableEmploymentType,
        DepartmentSummaryResponse applicableDepartment,
        boolean active,
        List<ChecklistTemplateTaskResponse> tasks,
        Instant createdAt,
        Instant updatedAt

) {}

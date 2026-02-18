package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.ChecklistStatus;
import com.mrlii.ems.domain.enums.ChecklistType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EmployeeChecklistResponse(

        UUID id,
        UUID employeeId,
        ChecklistType type,
        LocalDate referenceDate,
        ChecklistStatus status,

        // Percentage of completed tasks out of total tasks (0–100)
        int completionPercentage,

        List<EmployeeChecklistTaskResponse> tasks,
        Instant createdAt

) {}

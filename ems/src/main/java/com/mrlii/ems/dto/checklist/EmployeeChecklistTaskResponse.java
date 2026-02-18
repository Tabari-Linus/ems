package com.mrlii.ems.dto.checklist;

import com.mrlii.ems.domain.enums.ChecklistTaskStatus;
import com.mrlii.ems.domain.enums.OwnerType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeChecklistTaskResponse(

        UUID id,
        String title,
        String description,
        OwnerType assignedOwnerType,
        String assignedToUserEmail,
        LocalDate dueDate,
        boolean mandatory,
        ChecklistTaskStatus status,
        Instant completedAt,
        String notes

) {}

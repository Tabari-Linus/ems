package com.mrlii.ems.dto.offboarding;

import com.mrlii.ems.domain.enums.ExitReason;
import com.mrlii.ems.domain.enums.OffboardingStatus;
import com.mrlii.ems.dto.checklist.EmployeeChecklistResponse;
import com.mrlii.ems.dto.employee.EmployeeSummaryResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record OffboardingRecordResponse(

        UUID id,
        EmployeeSummaryResponse employee,
        ExitReason exitReason,
        LocalDate lastWorkingDay,
        OffboardingStatus status,
        EmployeeChecklistResponse checklist,

        // Null unless the caller holds the HR_MANAGER or SUPER_ADMIN role
        String exitInterviewNotes,

        Instant createdAt,
        Instant updatedAt

) {}

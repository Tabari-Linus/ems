package com.mrlii.ems.dto.employmenthistory;

import com.mrlii.ems.domain.enums.EmploymentHistoryChangeType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmploymentHistoryResponse(

        UUID id,
        EmploymentHistoryChangeType changeType,
        String oldValue,
        String newValue,
        String changedByUserEmail,
        LocalDate effectiveDate,
        String notes,
        Instant createdAt

) {}

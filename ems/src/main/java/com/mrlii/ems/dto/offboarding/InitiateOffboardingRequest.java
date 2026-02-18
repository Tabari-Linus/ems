package com.mrlii.ems.dto.offboarding;

import com.mrlii.ems.domain.enums.ExitReason;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record InitiateOffboardingRequest(

        @NotNull
        UUID employeeId,

        @NotNull
        ExitReason exitReason,

        @NotNull
        LocalDate lastWorkingDay,

        // Optional: if provided, the specified template is used for the offboarding checklist
        UUID checklistTemplateId

) {}

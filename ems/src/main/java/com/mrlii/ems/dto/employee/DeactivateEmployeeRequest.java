package com.mrlii.ems.dto.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DeactivateEmployeeRequest(

        @NotBlank
        String reason,

        @NotNull
        LocalDate effectiveDate

) {}

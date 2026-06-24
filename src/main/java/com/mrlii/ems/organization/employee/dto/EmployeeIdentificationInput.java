package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.organization.employee.enums.IdentificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmployeeIdentificationInput(
        @NotBlank String identificationNumber,
        @NotNull IdentificationType identificationType
) {
}

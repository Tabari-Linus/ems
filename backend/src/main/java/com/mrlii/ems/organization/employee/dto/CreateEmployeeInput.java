package com.mrlii.ems.organization.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEmployeeInput(
        @NotBlank @Size(min = 2, max = 100) String firstName,
        @NotBlank @Size(min = 2, max = 100) String lastName,
        @NotBlank @Email String workEmail,
        Long positionId,
        Long departmentId,
        Long accessLevelId,
        EmployeeBioInput bio,
        EmployeeContactInput contact,
        EmployeeAddressInput address,
        EmployeeIdentificationInput identification
) {
}

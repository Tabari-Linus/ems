package com.mrlii.ems.organization.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateEmployeeInput(
        @Size(min = 2, max = 100) String firstName,
        @Size(min = 2, max = 100) String lastName,
        @Email String workEmail,
        Long positionId,
        Long departmentId,
        Long accessLevelId,
        EmployeeBioInput bio,
        EmployeeContactInput contact
) {
}

package com.mrlii.ems.Organization.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateDepartmentInput(
        @NotBlank(message = "Department name must not be blank")
        @Size(min = 2, message = "Department name must be at least 2 characters")
        String departmentName,

        @NotBlank(message = "Department code must not be blank")
        @Size(min = 2, message = "Department code must be at least 2 characters")
        @Pattern(
                regexp = "^(?=.*[A-Za-z0-9])[A-Za-z0-9]+$",
                message = "Department code can only contain letters and numbers"
        )
        String departmentCode,

        String departmentPrefix,

        @NotBlank(message = "Department email must not be blank")
        @Pattern(
                regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                message = "Department email must be valid"
        )
        String departmentEmail,

        @Pattern(
                regexp = "^(\\+\\d{1,3}[- ]?)?\\d{7,15}$",
                message = "Phone number must be valid"
        )
        String departmentPhoneNumber,

        String departmentAddress,

        @NotNull(message = "Office ID is required")
        Long officeId
) {
}

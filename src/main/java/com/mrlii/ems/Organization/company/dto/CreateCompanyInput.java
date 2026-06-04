package com.mrlii.ems.Organization.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCompanyInput(
        @NotBlank(message = "Company name must not be blank")
        @Size(min = 2, message = "Company name must be at least 2")
        @Pattern(
                regexp = "^(?=.*[A-Za-z0-9])[A-Za-z0-9 ]+$",
                message = "Company name can only contain letters, numbers, and spaces"
        )
        String companyName,
        @NotBlank(message = "Company code must not be blank")
        @Size(min = 2, message = "Company code must be at least 2")
        @Pattern(
                regexp = "^(?=.*[A-Za-z0-9])[A-Za-z0-9]+$",
                message = "Company code can only contain letters, numbers, and spaces"
        )
        String companyCode,
        @NotBlank(message = "Company email must not be blank")
        @Pattern(
                regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                message = "Company email must be valid"
        )
        String companyEmail,
        @NotBlank(message = "Phone number is required")
        @Pattern(
                regexp = "^(\\+\\d{1,3}[- ]?)?\\d{7,15}$",
                message = "Phone number must be valid"
        )
        String companyPhoneNumber,
        @NotBlank(message = "Company address must not be blank")
        String companyAddress
) {
}

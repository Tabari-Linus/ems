package com.mrlii.ems.Organization.office.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOfficeInput(
        @NotBlank(message = "Office name must not be blank")
        @Size(min = 2, message = "Office name must be at least 2 characters")
        String officeName,

        @NotBlank(message = "Office email must not be blank")
        @Pattern(
                regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                message = "Office email must be valid"
        )
        String officeEmail,

        @Pattern(
                regexp = "^(\\+\\d{1,3}[- ]?)?\\d{7,15}$",
                message = "Phone number must be valid"
        )
        String officePhoneNumber,

        String officeAddress,

        @NotNull(message = "Company ID is required")
        Long companyId
) {
}
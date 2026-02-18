package com.mrlii.ems.dto.system;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCompanyProfileRequest(

        @NotBlank
        @Size(max = 200)
        String companyName,

        @Size(max = 500)
        String logoUrl,

        String address,

        @Size(max = 100)
        String registrationNumber,

        @Email
        @Size(max = 255)
        String contactEmail,

        @NotBlank
        @Size(max = 10)
        String employeeIdPrefix,

        @Min(1)
        int employeeIdPadding

) {}

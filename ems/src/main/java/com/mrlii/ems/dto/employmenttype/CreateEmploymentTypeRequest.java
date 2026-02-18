package com.mrlii.ems.dto.employmenttype;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEmploymentTypeRequest(

        @NotBlank
        @Size(max = 100)
        String name

) {}

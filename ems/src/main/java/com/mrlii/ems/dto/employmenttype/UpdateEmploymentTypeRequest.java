package com.mrlii.ems.dto.employmenttype;

import jakarta.validation.constraints.Size;

public record UpdateEmploymentTypeRequest(

        @Size(max = 100)
        String name,

        boolean active

) {}

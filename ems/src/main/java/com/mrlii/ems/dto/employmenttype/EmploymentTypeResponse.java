package com.mrlii.ems.dto.employmenttype;

import java.util.UUID;

public record EmploymentTypeResponse(

        UUID id,
        String name,
        boolean active

) {}

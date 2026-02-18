package com.mrlii.ems.dto.employee;

import java.util.UUID;

public record ManagerSummaryResponse(

        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String jobRoleTitle

) {}

package com.mrlii.ems.dto.employee;

import com.mrlii.ems.domain.enums.EmployeeStatus;

import java.time.LocalDate;
import java.util.UUID;

public record EmployeeSummaryResponse(

        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String email,
        String departmentName,
        String jobRoleTitle,
        EmployeeStatus status,
        LocalDate hireDate,
        String employmentTypeName

) {}

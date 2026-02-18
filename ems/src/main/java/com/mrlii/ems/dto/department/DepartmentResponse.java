package com.mrlii.ems.dto.department;

import com.mrlii.ems.domain.enums.DepartmentStatus;
import com.mrlii.ems.dto.employee.ManagerSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record DepartmentResponse(

        UUID id,
        String name,
        String code,
        String description,
        DepartmentStatus status,
        DepartmentSummaryResponse parentDepartment,
        ManagerSummaryResponse departmentHead,
        int employeeCount,
        Instant createdAt,
        Instant updatedAt

) {}

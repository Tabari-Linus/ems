package com.mrlii.ems.dto.jobrole;

import com.mrlii.ems.domain.enums.GradeLevel;
import com.mrlii.ems.domain.enums.JobRoleStatus;
import com.mrlii.ems.dto.department.DepartmentSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record JobRoleResponse(

        UUID id,
        String title,
        String code,
        GradeLevel gradeLevel,
        DepartmentSummaryResponse defaultDepartment,
        String description,
        boolean managerial,
        JobRoleStatus status,
        int employeeCount,
        Instant createdAt,
        Instant updatedAt

) {}

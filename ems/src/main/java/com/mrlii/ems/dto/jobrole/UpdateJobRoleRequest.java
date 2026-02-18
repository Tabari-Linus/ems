package com.mrlii.ems.dto.jobrole;

import com.mrlii.ems.domain.enums.GradeLevel;
import com.mrlii.ems.domain.enums.JobRoleStatus;
import jakarta.validation.constraints.Size;

import java.util.UUID;

// Code is intentionally excluded — it is immutable after creation (US-403)
public record UpdateJobRoleRequest(

        @Size(max = 100)
        String title,

        GradeLevel gradeLevel,

        UUID defaultDepartmentId,

        String description,

        boolean managerial,

        JobRoleStatus status

) {}

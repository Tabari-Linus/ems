package com.mrlii.ems.dto.department;

import com.mrlii.ems.domain.enums.DepartmentStatus;
import jakarta.validation.constraints.Size;

import java.util.UUID;

// Code is intentionally excluded — it is immutable after creation (US-303)
public record UpdateDepartmentRequest(

        @Size(max = 100)
        String name,

        String description,

        UUID parentDepartmentId,

        UUID departmentHeadId,

        DepartmentStatus status

) {}

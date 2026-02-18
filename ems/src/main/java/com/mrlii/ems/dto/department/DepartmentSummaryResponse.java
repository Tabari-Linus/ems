package com.mrlii.ems.dto.department;

import com.mrlii.ems.domain.enums.DepartmentStatus;

import java.util.UUID;

public record DepartmentSummaryResponse(

        UUID id,
        String name,
        String code,
        DepartmentStatus status

) {}

package com.mrlii.ems.dto.jobrole;

import com.mrlii.ems.domain.enums.GradeLevel;

import java.util.UUID;

public record JobRoleSummaryResponse(

        UUID id,
        String title,
        String code,
        GradeLevel gradeLevel,
        boolean managerial

) {}

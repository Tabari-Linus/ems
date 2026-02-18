package com.mrlii.ems.dto.jobrole;

import com.mrlii.ems.domain.enums.GradeLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateJobRoleRequest(

        @NotBlank
        @Size(max = 100)
        String title,

        @NotBlank
        @Size(max = 20)
        String code,

        @NotNull
        GradeLevel gradeLevel,

        UUID defaultDepartmentId,

        String description,

        boolean managerial

) {}

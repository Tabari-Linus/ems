package com.mrlii.ems.dto.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDepartmentRequest(

        @NotBlank
        @Size(max = 100)
        String name,

        @NotBlank
        @Size(max = 20)
        String code,

        String description,

        UUID parentDepartmentId,

        UUID departmentHeadId

) {}

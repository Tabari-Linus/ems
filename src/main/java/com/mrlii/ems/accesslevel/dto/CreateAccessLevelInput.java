package com.mrlii.ems.accesslevel.dto;

import com.mrlii.ems.accesslevel.enums.Permission;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAccessLevelInput(
        @NotBlank(message = "Access level name must not be blank")
        @Size(min = 2, message = "Access level name must be at least 2 characters")
        String accessLevelName,

        String description,

        @NotEmpty(message = "At least one permission must be selected")
        List<Permission> permissions,

        List<Long> employeeIds
) {
}

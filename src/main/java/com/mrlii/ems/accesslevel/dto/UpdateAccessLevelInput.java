package com.mrlii.ems.accesslevel.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateAccessLevelInput(
        @Size(min = 2, message = "Access level name must be at least 2 characters")
        String accessLevelName,

        String description,

        List<Long> addEmployeeIds,

        List<Long> removeEmployeeIds
) {
}

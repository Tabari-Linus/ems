package com.mrlii.ems.organization.position.dto;

import com.mrlii.ems.organization.position.enums.PositionLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePositionInput(
        @NotBlank @Size(min = 2, max = 100) String positionName,
        @NotNull PositionLevel level,
        String description
) {
}

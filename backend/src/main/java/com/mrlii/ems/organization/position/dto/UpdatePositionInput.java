package com.mrlii.ems.organization.position.dto;

import com.mrlii.ems.organization.position.enums.PositionLevel;

public record UpdatePositionInput(
        String positionName,
        PositionLevel level,
        String description
) {
}

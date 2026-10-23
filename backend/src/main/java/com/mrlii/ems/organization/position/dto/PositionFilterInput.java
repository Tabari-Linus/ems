package com.mrlii.ems.organization.position.dto;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.position.enums.PositionLevel;

public record PositionFilterInput(
        CommonStatus status,
        PositionLevel level,
        String search
) {
}

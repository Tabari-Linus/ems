package com.mrlii.ems.accesslevel.dto;

import com.mrlii.ems.common.enums.CommonStatus;

public record AccessLevelFilterInput(
        CommonStatus status,
        String search
) {
}

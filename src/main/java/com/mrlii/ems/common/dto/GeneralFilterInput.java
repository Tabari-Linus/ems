package com.mrlii.ems.common.dto;

import com.mrlii.ems.common.enums.CommonStatus;

public record GeneralFilterInput(
        CommonStatus status,
        String search
) {
}

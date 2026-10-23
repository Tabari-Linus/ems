package com.mrlii.ems.accesslevel.dto;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.DateTimeUtils;

import java.time.OffsetDateTime;

public record AccessLevelListItemResult(
        Long id,
        String accessLevelName,
        String description,
        CommonStatus status,
        OffsetDateTime createdDate
) {
    public static AccessLevelListItemResult of(AccessLevel accessLevel) {
        return new AccessLevelListItemResult(
                accessLevel.getId(),
                accessLevel.getAccessLevelName(),
                accessLevel.getDescription(),
                accessLevel.getStatus(),
                DateTimeUtils.toOffsetUtc(accessLevel.getCreatedDate())
        );
    }
}

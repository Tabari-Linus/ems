package com.mrlii.ems.organization.position.dto;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.DateTimeUtils;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;

import java.time.OffsetDateTime;

public record PositionDetailResult(
        Long id,
        String positionName,
        PositionLevel level,
        String description,
        CommonStatus status,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate
) {
    public static PositionDetailResult of(Position position) {
        return new PositionDetailResult(
                position.getId(),
                position.getPositionName(),
                position.getLevel(),
                position.getDescription(),
                position.getStatus(),
                DateTimeUtils.toOffsetUtc(position.getCreatedDate()),
                DateTimeUtils.toOffsetUtc(position.getLastModifiedDate())
        );
    }
}

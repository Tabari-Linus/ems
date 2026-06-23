package com.mrlii.ems.accesslevel.dto;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.DateTimeUtils;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;

import java.time.OffsetDateTime;
import java.util.List;

public record AccessLevelDetailResult(
        Long id,
        String accessLevelName,
        String description,
        CommonStatus status,
        List<PermissionSetResult> permissions,
        List<EmployeeListItemResult> employees,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate
) {
    public static AccessLevelDetailResult of(AccessLevel accessLevel) {
        return new AccessLevelDetailResult(
                accessLevel.getId(),
                accessLevel.getAccessLevelName(),
                accessLevel.getDescription(),
                accessLevel.getStatus(),
                accessLevel.getPermissions().stream().map(PermissionSetResult::of).toList(),
                accessLevel.getEmployees().stream().map(EmployeeListItemResult::of).toList(),
                DateTimeUtils.toOffsetUtc(accessLevel.getCreatedDate()),
                DateTimeUtils.toOffsetUtc(accessLevel.getLastModifiedDate())
        );
    }
}

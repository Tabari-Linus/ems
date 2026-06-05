package com.mrlii.ems.Organization.department.dto;

import com.mrlii.ems.Organization.department.entity.Department;

import java.time.OffsetDateTime;
import com.mrlii.ems.common.util.DateTimeUtils;

public record DepartmentListItemResult(
        Long id,
        String departmentName,
        String departmentCode,
        String departmentPrefix,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress,
        String departmentStatus,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate
) {
    public static DepartmentListItemResult of(Department department) {
        return new DepartmentListItemResult(
                department.getId(),
                department.getDepartmentName(),
                department.getDepartmentCode(),
                department.getDepartmentPrefix(),
                department.getDepartmentEmail(),
                department.getDepartmentPhoneNumber(),
                department.getDepartmentAddress(),
                department.getDepartmentStatus().name(),
                DateTimeUtils.toOffsetUtc(department.getCreatedDate()),
                department.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(department.getLastModifiedDate())
        );
    }
}

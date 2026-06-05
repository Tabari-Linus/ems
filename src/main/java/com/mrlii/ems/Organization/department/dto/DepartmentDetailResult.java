package com.mrlii.ems.Organization.department.dto;

import com.mrlii.ems.Organization.department.entity.Department;
import com.mrlii.ems.Organization.office.dto.OfficeResult;
import com.mrlii.ems.common.util.DateTimeUtils;
import java.time.OffsetDateTime;

public record DepartmentDetailResult(
        Long id,
        String departmentName,
        String departmentCode,
        String departmentPrefix,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress,
        String departmentStatus,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate,
        OfficeResult office
) {
    public static DepartmentDetailResult of(Department department) {
        return new DepartmentDetailResult(
                department.getId(),
                department.getDepartmentName(),
                department.getDepartmentCode(),
                department.getDepartmentPrefix(),
                department.getDepartmentEmail(),
                department.getDepartmentPhoneNumber(),
                department.getDepartmentAddress(),
                department.getDepartmentStatus().name(),
                DateTimeUtils.toOffsetUtc(department.getCreatedDate()),
                department.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(department.getLastModifiedDate()),
                department.getOffice() != null ? OfficeResult.of(department.getOffice()) : null
        );
    }

    public static DepartmentDetailResult ofInsideOffice(Department department) {
        return new DepartmentDetailResult(
                department.getId(),
                department.getDepartmentName(),
                department.getDepartmentCode(),
                department.getDepartmentPrefix(),
                department.getDepartmentEmail(),
                department.getDepartmentPhoneNumber(),
                department.getDepartmentAddress(),
                department.getDepartmentStatus().name(),
                DateTimeUtils.toOffsetUtc(department.getCreatedDate()),
                department.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(department.getLastModifiedDate()),
                null
        );
    }
}

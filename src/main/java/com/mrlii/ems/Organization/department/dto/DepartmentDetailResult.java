package com.mrlii.ems.Organization.department.dto;

import com.mrlii.ems.Organization.department.entity.Department;
import com.mrlii.ems.Organization.office.dto.OfficeResult;

public record DepartmentDetailResult(
        Long id,
        String departmentName,
        String departmentCode,
        String departmentPrefix,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress,
        String departmentStatus,
        String createdDate,
        String lastModifiedDate,
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
                department.getCreatedDate().toString(),
                department.getLastModifiedDate() == null ? null : department.getLastModifiedDate().toString(),
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
                department.getCreatedDate().toString(),
                department.getLastModifiedDate() == null ? null : department.getLastModifiedDate().toString(),
                null
        );
    }
}

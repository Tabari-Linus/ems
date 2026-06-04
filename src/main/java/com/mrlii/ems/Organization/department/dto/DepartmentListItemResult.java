package com.mrlii.ems.Organization.department.dto;

import com.mrlii.ems.Organization.department.entity.Department;

import java.time.LocalDateTime;

public record DepartmentListItemResult(
        Long id,
        String departmentName,
        String departmentCode,
        String departmentPrefix,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress,
        String departmentStatus,
        LocalDateTime createdDate,
        LocalDateTime lastModifiedDate
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
                department.getCreatedDate(),
                department.getLastModifiedDate()
        );
    }
}

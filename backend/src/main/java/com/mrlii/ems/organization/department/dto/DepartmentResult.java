package com.mrlii.ems.organization.department.dto;

import com.mrlii.ems.organization.department.entity.Department;

public record DepartmentResult(
        Long id,
        String departmentName
) {
    public static DepartmentResult of(Department department) {
        return new DepartmentResult(department.getId(), department.getDepartmentName());
    }
}

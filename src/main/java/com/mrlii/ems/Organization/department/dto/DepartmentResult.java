package com.mrlii.ems.Organization.department.dto;

import com.mrlii.ems.Organization.department.entity.Department;

public record DepartmentResult(
        Long id,
        String departmentName
) {
    public static DepartmentResult of(Department department) {
        return new DepartmentResult(department.getId(), department.getDepartmentName());
    }
}

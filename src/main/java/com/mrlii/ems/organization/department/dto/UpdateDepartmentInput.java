package com.mrlii.ems.organization.department.dto;

public record UpdateDepartmentInput(
        String departmentName,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress
) {
}
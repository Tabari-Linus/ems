package com.mrlii.ems.Organization.department.dto;

public record UpdateDepartmentInput(
        String departmentName,
        String departmentCode,
        String departmentPrefix,
        String departmentEmail,
        String departmentPhoneNumber,
        String departmentAddress
) {
}

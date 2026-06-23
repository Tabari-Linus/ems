package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;

public record EmployeeListItemResult(
        Long id,
        String firstName,
        String lastName,
        String email,
        String jobTitle,
        String department,
        CommonStatus status
) {
    public static EmployeeListItemResult of(Employee employee) {
        return new EmployeeListItemResult(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getWorkEmail(),
                null,
                null,
                null
        );
    }
}

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
        String jobTitle = employee.getPosition() != null
                ? employee.getPosition().getLevel().name() + " · " + employee.getPosition().getPositionName()
                : null;
        String department = employee.getDepartment() != null
                ? employee.getDepartment().getDepartmentName()
                : null;
        return new EmployeeListItemResult(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getWorkEmail(),
                jobTitle,
                department,
                employee.getStatus()
        );
    }
}

package com.mrlii.ems.organization.employee.dto;

import java.util.Set;

public record EmployeeContactInput(
        Set<String> phoneNumbers,
        Set<String> personalEmails
) {
}

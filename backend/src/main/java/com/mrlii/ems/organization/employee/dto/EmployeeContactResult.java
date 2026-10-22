package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.organization.employee.entity.EmployeeContact;

import java.util.Set;

public record EmployeeContactResult(
        Set<String> phoneNumbers,
        Set<String> personalEmails
) {
    public static EmployeeContactResult of(EmployeeContact contact) {
        if (contact == null) return null;
        return new EmployeeContactResult(
                contact.getPhoneNumbers(),
                contact.getPersonalEmails()
        );
    }
}

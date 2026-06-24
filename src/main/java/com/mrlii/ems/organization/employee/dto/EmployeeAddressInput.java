package com.mrlii.ems.organization.employee.dto;

public record EmployeeAddressInput(
        String street,
        String city,
        String state,
        String zipCode,
        String country,
        String digitalAddress,
        Boolean isCurrentAddress
) {
}

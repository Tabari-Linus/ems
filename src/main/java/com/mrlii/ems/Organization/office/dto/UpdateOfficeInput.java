package com.mrlii.ems.Organization.office.dto;

public record UpdateOfficeInput(
        String officeName,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress
) {
}
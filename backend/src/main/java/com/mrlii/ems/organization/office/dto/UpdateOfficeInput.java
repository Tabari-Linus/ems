package com.mrlii.ems.organization.office.dto;

public record UpdateOfficeInput(
        String officeName,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress
) {
}
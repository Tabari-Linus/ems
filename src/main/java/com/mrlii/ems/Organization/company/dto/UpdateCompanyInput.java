package com.mrlii.ems.Organization.company.dto;

public record UpdateCompanyInput(
        String companyName,
        String companyCode,
        String companyEmail,
        String companyPhone,
        String companyPhoneNumber,
        String companyAddress
) {
}

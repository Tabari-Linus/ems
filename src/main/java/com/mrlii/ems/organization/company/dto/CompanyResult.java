package com.mrlii.ems.organization.company.dto;

import com.mrlii.ems.organization.company.entity.Company;

public record CompanyResult(
        Long id,
        String companyName
) {
    public static CompanyResult of(Company company) {
        return new CompanyResult(
                company.getId(),
                company.getCompanyName()
        );
    }

}

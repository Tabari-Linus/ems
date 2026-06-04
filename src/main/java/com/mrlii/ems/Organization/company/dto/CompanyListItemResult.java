package com.mrlii.ems.Organization.company.dto;

import com.mrlii.ems.Organization.company.entity.Company;

import java.time.LocalDateTime;

public record CompanyListItemResult(
        Long id,
        String companyName,
        String companyCode,
        String companyEmail,
        String companyPhone,
        String companyPhoneNumber,
        String companyAddress,
        LocalDateTime createdDate,
        LocalDateTime lastModifiedDate

) {
    public static CompanyListItemResult of(Company company) {
        return new CompanyListItemResult(
                company.getId(),
                company.getCompanyName(),
                company.getCompanyCode(),
                company.getCompanyEmail(),
                company.getCompanyPhoneNumber(),
                company.getCompanyAddress(),
                company.getCompanyStatus().name(),
                company.getCreatedDate(),
                company.getLastModifiedDate()
                );

    }
}

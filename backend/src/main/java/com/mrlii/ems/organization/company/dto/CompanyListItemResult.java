package com.mrlii.ems.organization.company.dto;

import com.mrlii.ems.organization.company.entity.Company;

import java.time.OffsetDateTime;
import com.mrlii.ems.common.util.DateTimeUtils;

public record CompanyListItemResult(
        Long id,
        String companyName,
        String companyCode,
        String companyEmail,
        String companyPhone,
        String companyPhoneNumber,
        String companyAddress,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate

) {
    public static CompanyListItemResult of(Company company) {
        return new CompanyListItemResult(
                company.getId(),
                company.getCompanyName(),
                company.getCompanyCode(),
                company.getCompanyEmail(),
                company.getCompanyPhoneNumber(),
                company.getCompanyPhoneNumber(),
                company.getCompanyAddress(),
                DateTimeUtils.toOffsetUtc(company.getCreatedDate()),
                company.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(company.getLastModifiedDate())
                );

    }
}

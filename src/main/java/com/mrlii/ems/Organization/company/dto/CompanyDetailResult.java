package com.mrlii.ems.Organization.company.dto;

import com.mrlii.ems.Organization.company.entity.Company;
import com.mrlii.ems.Organization.office.dto.OfficeDetailResult;
import com.mrlii.ems.common.util.DateTimeUtils;

import java.time.OffsetDateTime;

import java.util.List;

public record CompanyDetailResult(
        Long id,
        String companyName,
        String companyCode,
        String companyEmail,
        String companyPhone,
        String companyPhoneNumber,
        String companyAddress,
        Long nextOfficeNumber,
        String companyStatus,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate,
        List<OfficeDetailResult> offices
) {
    public static CompanyDetailResult of(Company company) {
        return new CompanyDetailResult(
                company.getId(),
                company.getCompanyName(),
                company.getCompanyCode(),
                company.getCompanyEmail(),
                company.getCompanyPhoneNumber(),
                company.getCompanyPhoneNumber(),
                company.getCompanyAddress(),
                company.getNextOfficeNumber(),
                company.getCompanyStatus().name(),
                DateTimeUtils.toOffsetUtc(company.getCreatedDate()),
                company.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(company.getLastModifiedDate()),
                company.getOffices().stream().map(OfficeDetailResult::ofInsideCompany).toList()
        );
    }
}

package com.mrlii.ems.Organization.company.dto;

import com.mrlii.ems.Organization.company.entity.Company;
import com.mrlii.ems.Organization.office.dto.OfficeDetailResult;

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
        String createdDate,
        String lastModifiedDate,
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
                company.getCreatedDate().toString(),
                company.getLastModifiedDate() == null ? null : company.getLastModifiedDate().toString(),
                company.getOffices().stream().map(OfficeDetailResult::ofInsideCompany).toList()
        );
    }
}

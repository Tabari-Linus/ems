package com.mrlii.ems.Organization.office.dto;

import com.mrlii.ems.Organization.company.dto.CompanyResult;
import com.mrlii.ems.Organization.department.dto.DepartmentDetailResult;
import com.mrlii.ems.Organization.office.entity.Office;

import java.util.List;

public record OfficeDetailResult(
        Long id,
        String officeName,
        String officeCode,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress,
        String officeStatus,
        String createdDate,
        String lastModifiedDate,
        CompanyResult company,
        List<DepartmentDetailResult> departments
) {
    public static OfficeDetailResult of(Office office) {
        return new OfficeDetailResult(
                office.getId(),
                office.getOfficeName(),
                office.getOfficeCode(),
                office.getOfficeEmail(),
                office.getOfficePhoneNumber(),
                office.getOfficeAddress(),
                office.getOfficeStatus().name(),
                office.getCreatedDate().toString(),
                office.getLastModifiedDate() == null ? null : office.getLastModifiedDate().toString(),
                office.getCompany() != null ? CompanyResult.of(office.getCompany()) : null,
                office.getDepartments().stream().map(DepartmentDetailResult::ofInsideOffice).toList()
        );
    }

    public static OfficeDetailResult ofInsideCompany(Office office) {
        return new OfficeDetailResult(
                office.getId(),
                office.getOfficeName(),
                office.getOfficeCode(),
                office.getOfficeEmail(),
                office.getOfficePhoneNumber(),
                office.getOfficeAddress(),
                office.getOfficeStatus().name(),
                office.getCreatedDate().toString(),
                office.getLastModifiedDate() == null ? null : office.getLastModifiedDate().toString(),
                null,
                office.getDepartments().stream().map(DepartmentDetailResult::ofInsideOffice).toList()
        );
    }
}

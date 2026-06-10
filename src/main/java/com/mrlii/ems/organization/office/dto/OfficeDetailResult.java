package com.mrlii.ems.organization.office.dto;

import com.mrlii.ems.organization.company.dto.CompanyResult;
import com.mrlii.ems.organization.department.dto.DepartmentDetailResult;
import com.mrlii.ems.organization.office.entity.Office;
import com.mrlii.ems.common.util.DateTimeUtils;

import java.util.List;
import java.time.OffsetDateTime;

public record OfficeDetailResult(
        Long id,
        String officeName,
        String officeCode,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress,
        String officeStatus,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate,
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
                DateTimeUtils.toOffsetUtc(office.getCreatedDate()),
                office.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(office.getLastModifiedDate()),
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
                DateTimeUtils.toOffsetUtc(office.getCreatedDate()),
                office.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(office.getLastModifiedDate()),
                null,
                office.getDepartments().stream().map(DepartmentDetailResult::ofInsideOffice).toList()
        );
    }
}

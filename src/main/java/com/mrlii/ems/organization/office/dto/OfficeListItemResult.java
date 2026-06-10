package com.mrlii.ems.organization.office.dto;

import com.mrlii.ems.organization.office.entity.Office;

import java.time.OffsetDateTime;
import com.mrlii.ems.common.util.DateTimeUtils;

public record OfficeListItemResult(
        Long id,
        String officeName,
        String officeCode,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress,
        String officeStatus,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate
) {
    public static OfficeListItemResult of(Office office) {
        return new OfficeListItemResult(
                office.getId(),
                office.getOfficeName(),
                office.getOfficeCode(),
                office.getOfficeEmail(),
                office.getOfficePhoneNumber(),
                office.getOfficeAddress(),
                office.getOfficeStatus().name(),
                DateTimeUtils.toOffsetUtc(office.getCreatedDate()),
                office.getLastModifiedDate() == null ? null : DateTimeUtils.toOffsetUtc(office.getLastModifiedDate())
        );
    }
}

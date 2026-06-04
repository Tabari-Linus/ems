package com.mrlii.ems.Organization.office.dto;

import com.mrlii.ems.Organization.office.entity.Office;

import java.time.LocalDateTime;

public record OfficeListItemResult(
        Long id,
        String officeName,
        String officeCode,
        String officeEmail,
        String officePhoneNumber,
        String officeAddress,
        String officeStatus,
        LocalDateTime createdDate,
        LocalDateTime lastModifiedDate
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
                office.getCreatedDate(),
                office.getLastModifiedDate()
        );
    }
}

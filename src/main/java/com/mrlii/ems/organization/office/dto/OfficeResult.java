package com.mrlii.ems.organization.office.dto;

import com.mrlii.ems.organization.office.entity.Office;

public record OfficeResult(
        Long id,
        String officeName
) {
    public static OfficeResult of(Office office) {
        return new OfficeResult(office.getId(), office.getOfficeName());
    }
}

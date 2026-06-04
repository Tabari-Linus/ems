package com.mrlii.ems.Organization.office.dto;

import com.mrlii.ems.Organization.office.entity.Office;

public record OfficeResult(
        Long id,
        String officeName
) {
    public static OfficeResult of(Office office) {
        return new OfficeResult(office.getId(), office.getOfficeName());
    }
}

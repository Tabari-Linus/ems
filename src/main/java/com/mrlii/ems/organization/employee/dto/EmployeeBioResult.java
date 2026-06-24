package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.organization.employee.entity.EmployeeBio;

public record EmployeeBioResult(
        String fullName,
        String otherName,
        String gender,
        String nationality,
        String maritalStatus,
        String dateOfBirth,
        String placeOfBirth,
        String profilePicture,
        String dateHired,
        String isExpert
) {
    public static EmployeeBioResult of(EmployeeBio bio) {
        if (bio == null) return null;
        return new EmployeeBioResult(
                bio.getFullName(),
                bio.getOtherName(),
                bio.getGender(),
                bio.getNationality(),
                bio.getMaritalStatus(),
                bio.getDateOfBirth(),
                bio.getPlaceOfBirth(),
                bio.getProfilePicture(),
                bio.getDateHired() != null ? bio.getDateHired().toString() : null,
                bio.getIsExpert()
        );
    }
}

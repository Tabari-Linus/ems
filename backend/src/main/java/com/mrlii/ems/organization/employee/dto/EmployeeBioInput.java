package com.mrlii.ems.organization.employee.dto;

public record EmployeeBioInput(
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
}

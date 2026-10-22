package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.organization.employee.entity.EmployeeIdentification;
import com.mrlii.ems.organization.employee.enums.IdentificationType;

public record EmployeeIdentificationResult(
        Long id,
        String identificationNumber,
        IdentificationType identificationType
) {
    public static EmployeeIdentificationResult of(EmployeeIdentification identification) {
        return new EmployeeIdentificationResult(
                identification.getId(),
                identification.getIdentificationNumber(),
                identification.getIdentificationType()
        );
    }
}

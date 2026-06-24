package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.organization.employee.entity.EmployeeAddress;

public record EmployeeAddressResult(
        Long id,
        String street,
        String city,
        String state,
        String zipCode,
        String country,
        String digitalAddress,
        Boolean isCurrentAddress
) {
    public static EmployeeAddressResult of(EmployeeAddress address) {
        return new EmployeeAddressResult(
                address.getId(),
                address.getStreet(),
                address.getCity(),
                address.getState(),
                address.getZipCode(),
                address.getCountry(),
                address.getDigitalAddress(),
                address.getIsCurrentAddress()
        );
    }
}

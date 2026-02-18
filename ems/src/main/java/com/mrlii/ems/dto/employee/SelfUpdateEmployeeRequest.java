package com.mrlii.ems.dto.employee;

import jakarta.validation.constraints.Size;

// Employee self-service update (US-205)
// Employment fields (department, role, status) are intentionally excluded
public record SelfUpdateEmployeeRequest(

        @Size(max = 20)
        String phone,

        @Size(max = 255)
        String addressLine1,

        @Size(max = 255)
        String addressLine2,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String state,

        @Size(max = 20)
        String postalCode,

        @Size(max = 100)
        String country,

        @Size(max = 100)
        String emergencyContactName,

        @Size(max = 20)
        String emergencyContactPhone,

        @Size(max = 50)
        String emergencyContactRelationship

) {}

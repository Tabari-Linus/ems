package com.mrlii.ems.dto.profileupdate;

import jakarta.validation.constraints.Size;

// Submitted by the employee (US-205); HR receives a notification to approve
// Employment-related fields (department, role, status) are intentionally excluded
public record SubmitProfileUpdateRequest(

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

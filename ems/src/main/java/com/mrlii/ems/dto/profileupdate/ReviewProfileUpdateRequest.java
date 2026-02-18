package com.mrlii.ems.dto.profileupdate;

import jakarta.validation.constraints.NotNull;

// Submitted by HR Manager to approve or reject a profile update request
public record ReviewProfileUpdateRequest(

        @NotNull
        Boolean approved,

        // Required when approved = false
        String rejectionReason

) {}

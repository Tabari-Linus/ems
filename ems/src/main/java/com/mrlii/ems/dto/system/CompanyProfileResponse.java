package com.mrlii.ems.dto.system;

import java.time.Instant;
import java.util.UUID;

public record CompanyProfileResponse(

        UUID id,
        String companyName,
        String logoUrl,
        String address,
        String registrationNumber,
        String contactEmail,
        String employeeIdPrefix,
        int employeeIdPadding,
        int employeeIdCurrentSequence,
        Instant updatedAt

) {}

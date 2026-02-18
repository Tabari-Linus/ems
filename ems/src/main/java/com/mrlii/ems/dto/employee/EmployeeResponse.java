package com.mrlii.ems.dto.employee;

import com.mrlii.ems.domain.enums.EmployeeStatus;
import com.mrlii.ems.domain.enums.Gender;
import com.mrlii.ems.dto.department.DepartmentSummaryResponse;
import com.mrlii.ems.dto.employmenttype.EmploymentTypeResponse;
import com.mrlii.ems.dto.jobrole.JobRoleSummaryResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponse(

        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        Gender gender,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country,

        // Masked at the service layer for non-privileged callers (e.g. "***456")
        String nationalId,

        String profilePhotoUrl,
        LocalDate hireDate,
        EmploymentTypeResponse employmentType,
        EmployeeStatus status,
        DepartmentSummaryResponse department,
        JobRoleSummaryResponse jobRole,
        ManagerSummaryResponse lineManager,
        String emergencyContactName,
        String emergencyContactPhone,
        String emergencyContactRelationship,
        Instant createdAt,
        Instant updatedAt

) {}

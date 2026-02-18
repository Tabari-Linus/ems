package com.mrlii.ems.dto.employee;

import com.mrlii.ems.domain.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

// All fields are optional — null means "leave unchanged" (service layer handles the merge)
// Status changes go through dedicated deactivate/reactivate endpoints (US-207, US-208)
public record UpdateEmployeeRequest(

        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @Email
        @Size(max = 255)
        String email,

        @Size(max = 20)
        String phone,

        @Past
        LocalDate dateOfBirth,

        Gender gender,

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

        @Size(max = 50)
        String nationalId,

        LocalDate hireDate,

        UUID employmentTypeId,

        UUID departmentId,

        UUID jobRoleId,

        UUID lineManagerId,

        @Size(max = 100)
        String emergencyContactName,

        @Size(max = 20)
        String emergencyContactPhone,

        @Size(max = 50)
        String emergencyContactRelationship

) {}

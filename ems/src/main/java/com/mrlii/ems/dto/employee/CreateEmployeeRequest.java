package com.mrlii.ems.dto.employee;

import com.mrlii.ems.domain.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateEmployeeRequest(

        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @NotBlank
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

        @NotNull
        LocalDate hireDate,

        @NotNull
        UUID employmentTypeId,

        @NotNull
        UUID departmentId,

        @NotNull
        UUID jobRoleId,

        UUID lineManagerId,

        @Size(max = 100)
        String emergencyContactName,

        @Size(max = 20)
        String emergencyContactPhone,

        @Size(max = 50)
        String emergencyContactRelationship

) {}

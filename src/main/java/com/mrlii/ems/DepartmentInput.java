package com.mrlii.ems;

import com.mrlii.ems.common.enums.CommonStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link com.mrlii.ems.Organization.department.entity.Department}
 */
public record DepartmentInput(
        @Size(min = 2, max = 100)
        @Pattern(regexp = "^(?=.*[A-Za-z0-9])[A-Za-z0-9]+$")
        @NotBlank(message = "Department name is required")
        String departmentName,
        @NotBlank(message = "Department code is required")
        @Size(min = 2, max = 10)
        String departmentCode,
        @NotBlank(message = "Department prefix is required")
        @Size(min = 2, max = 10)
        String departmentPrefix,
        @NotBlank(message = "Department email is required")
        @Email(message = "Department email should be valid")
        String departmentEmail,
        String departmentPhoneNumber,
        @NotBlank(message = "Department address is required")
        @Size(min = 2, max = 150)
        String departmentAddress,
        CommonStatus departmentStatus) implements Serializable {
}
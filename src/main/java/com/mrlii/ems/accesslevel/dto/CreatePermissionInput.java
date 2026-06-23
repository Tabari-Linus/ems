package com.mrlii.ems.accesslevel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePermissionInput (
        @NotBlank(message = "Permission name must not be blank")
        @Size(min = 2, message = "Permission name must be at least 2 characters")
        String permissionName
){
}

package com.mrlii.ems.accesslevel.dto;

import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;

public record PermissionSetResult(
        Long id,
        Permission permissionName
) {
    public static PermissionSetResult of(PermissionSet permissionSet) {
        return new PermissionSetResult(permissionSet.getId(), permissionSet.getPermissionName());
    }
}

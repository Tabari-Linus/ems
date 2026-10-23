package com.mrlii.ems.auth.security;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * The server-side view of the caller, resolved per request from the token subject (and cached briefly).
 * {@code permissions} are the effective permissions of the employee's access level: empty when the
 * level is missing, not ACTIVE or deleted.
 */
public record AuthenticatedAccount(
        Long accountId,
        UUID publicId,
        String email,
        Long employeeId,
        Long accessLevelId,
        Set<Permission> permissions
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public AuthenticatedAccount {
        permissions = permissions == null || permissions.isEmpty()
                ? Collections.unmodifiableSet(EnumSet.noneOf(Permission.class))
                : Collections.unmodifiableSet(EnumSet.copyOf(permissions));
    }

    public static AuthenticatedAccount of(UserAccount account) {
        Employee employee = account.getEmployee();
        AccessLevel accessLevel = employee == null ? null : employee.getAccessLevel();
        return new AuthenticatedAccount(
                account.getId(),
                account.getPublicId(),
                account.getEmail(),
                employee == null ? null : employee.getId(),
                accessLevel == null ? null : accessLevel.getId(),
                effectivePermissions(accessLevel));
    }

    /** Permissions granted by an access level, or none when it is absent, not ACTIVE or deleted. */
    public static Set<Permission> effectivePermissions(AccessLevel accessLevel) {
        if (accessLevel == null
                || accessLevel.getStatus() != CommonStatus.ACTIVE
                || accessLevel.getDeletedAt() != null
                || accessLevel.getPermissions() == null) {
            return EnumSet.noneOf(Permission.class);
        }
        Set<Permission> permissions = EnumSet.noneOf(Permission.class);
        for (PermissionSet permissionSet : accessLevel.getPermissions()) {
            permissions.add(permissionSet.getPermissionName());
        }
        return permissions;
    }

    public List<GrantedAuthority> authorities() {
        return permissions.stream()
                .<GrantedAuthority>map(permission -> new SimpleGrantedAuthority(permission.name()))
                .toList();
    }

    /** Permissions in declaration order, for the {@code me} query and the legacy claim. */
    public List<Permission> sortedPermissions() {
        return permissions.stream().sorted().toList();
    }
}

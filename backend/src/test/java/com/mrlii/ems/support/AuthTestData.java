package com.mrlii.ems.support;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.common.config.AuthProperties;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;

import java.time.Duration;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

/** Shared fixtures for auth unit tests. */
public final class AuthTestData {

    public static final String ISSUER = "ems-api-test";
    public static final String AUDIENCE = "ems-web-test";

    private AuthTestData() {}

    public static AuthProperties authProperties(boolean legacyPermissionsClaim) {
        return new AuthProperties(
                new AuthProperties.Jwt(ISSUER, AUDIENCE),
                legacyPermissionsClaim,
                new AuthProperties.Lockout(5, Duration.ofMinutes(15)),
                new AuthProperties.RateLimit(3, Duration.ofMinutes(1)),
                new AuthProperties.Tokens(Duration.ofHours(72), Duration.ofHours(1)),
                Duration.ofSeconds(60));
    }

    public static AuthProperties authProperties() {
        return authProperties(false);
    }

    public static AccessLevel accessLevel(CommonStatus status, Permission... permissions) {
        AccessLevel level = AccessLevel.builder().id(3L).accessLevelName("LEVEL").status(status).build();
        level.setPermissions(Arrays.stream(permissions)
                .map(p -> PermissionSet.builder().permissionName(p).accessLevel(level).build())
                .collect(Collectors.toSet()));
        return level;
    }

    public static Employee employee(CommonStatus status, AccessLevel level) {
        return Employee.builder().id(5L).firstName("Ama").status(status).accessLevel(level).build();
    }

    /** An enabled account with a password hash, an ACTIVE employee and an ACTIVE level granting VIEW_SELF. */
    public static UserAccount activeAccount() {
        return UserAccount.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .email("ama@example.com")
                .passwordHash("hash")
                .employee(employee(CommonStatus.ACTIVE, accessLevel(CommonStatus.ACTIVE, Permission.VIEW_SELF)))
                .build();
    }
}

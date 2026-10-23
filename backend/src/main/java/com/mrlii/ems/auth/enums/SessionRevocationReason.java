package com.mrlii.ems.auth.enums;

public enum SessionRevocationReason {
    ROTATED,
    LOGOUT,
    LOGOUT_ALL,
    REUSE_DETECTED,
    EXPIRED,
    PASSWORD_SET,
    PASSWORD_CHANGED,
    ACCOUNT_INACTIVE
}

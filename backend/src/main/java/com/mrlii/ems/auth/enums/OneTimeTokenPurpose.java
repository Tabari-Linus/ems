package com.mrlii.ems.auth.enums;

public enum OneTimeTokenPurpose {
    /** Sent in the welcome email; setting the password moves the employee PENDING → ACTIVE. */
    WELCOME,
    /** Issued by an administrator (Slice 4 adds the manager-approved flow). */
    PASSWORD_RESET
}

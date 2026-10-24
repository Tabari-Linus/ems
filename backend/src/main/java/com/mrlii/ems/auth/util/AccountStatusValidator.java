package com.mrlii.ems.auth.util;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Status gates shared by login, refresh and every authenticated request: the account must be enabled
 * and not locked, and its employee (if any) must not be INACTIVE, ARCHIVED or deleted.
 */
@Component
public class AccountStatusValidator {

    static final String MSG_DISABLED = "This account is disabled. Contact your administrator.";
    static final String MSG_LOCKED = "Too many failed sign-in attempts. Try again later.";
    static final String MSG_DEACTIVATED = "Your account is deactivated. Contact your administrator.";
    static final String MSG_ARCHIVED = "This account is no longer active.";

    /** Gate for any use of the account (login after the password check, refresh, each request). */
    public void assertUsable(UserAccount account, Instant now) {
        assertEmployeeActive(account);
        if (account.isLockedAt(now)) {
            throw new AuthException(AuthErrorCode.ACCOUNT_LOCKED, MSG_LOCKED);
        }
    }

    /** Gate without the lock check, for flows that legitimately unlock (setting a password). */
    public void assertEmployeeActive(UserAccount account) {
        if (!account.isEnabled()) {
            throw new AuthException(AuthErrorCode.ACCOUNT_INACTIVE, MSG_DISABLED);
        }
        Employee employee = account.getEmployee();
        if (employee == null) {
            return;
        }
        if (employee.getDeletedAt() != null || employee.getStatus() == CommonStatus.ARCHIVED) {
            throw new AuthException(AuthErrorCode.ACCOUNT_INACTIVE, MSG_ARCHIVED);
        }
        if (employee.getStatus() == CommonStatus.INACTIVE) {
            throw new AuthException(AuthErrorCode.ACCOUNT_INACTIVE, MSG_DEACTIVATED);
        }
    }

    public static String lockedMessage() {
        return MSG_LOCKED;
    }
}

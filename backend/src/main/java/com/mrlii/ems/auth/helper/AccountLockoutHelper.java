package com.mrlii.ems.auth.helper;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.service.AuditService;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.config.AuthProperties;
import com.mrlii.ems.common.dto.ClientInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Brute-force protection per account: after {@code app.auth.lockout.max-failed-attempts} (5) wrong
 * passwords in a row the account is locked for {@code app.auth.lockout.duration} (15 min). A successful
 * login or setting a password resets the counter.
 */
@Component
@RequiredArgsConstructor
public class AccountLockoutHelper {

    private final UserAccountRepository userAccountRepository;
    private final AuditService auditService;
    private final AuthProperties authProperties;

    /** Counts a failed password; returns {@code true} when this failure locked the account. */
    public boolean recordFailedAttempt(UserAccount account, ClientInfo client, Instant now) {
        int attempts = account.getFailedLoginAttempts() + 1;
        AuthProperties.Lockout lockout = authProperties.lockout();
        if (attempts >= lockout.maxFailedAttempts()) {
            Instant lockedUntil = now.plus(lockout.duration());
            account.setFailedLoginAttempts(0);
            account.setLockedUntil(lockedUntil);
            userAccountRepository.save(account);
            auditService.recordForAccount(AuditAction.ACCOUNT_LOCKED, account.getId(), client,
                    Map.of("failedAttempts", attempts, "lockedUntil", lockedUntil.toString()));
            return true;
        }
        account.setFailedLoginAttempts(attempts);
        userAccountRepository.save(account);
        return false;
    }

    public void recordSuccessfulLogin(UserAccount account, Instant now) {
        account.setFailedLoginAttempts(0);
        account.setLockedUntil(null);
        account.setLastLoginAt(now);
        userAccountRepository.save(account);
    }
}

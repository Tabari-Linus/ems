package com.mrlii.ems.auth.helper;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.service.AuditService;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.dto.ClientInfo;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountLockoutHelperTest {

    private static final Instant NOW = Instant.parse("2026-06-01T12:00:00Z");
    private static final ClientInfo CLIENT = new ClientInfo("1.2.3.4", "ua");

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private AuditService auditService;

    private AccountLockoutHelper helper;
    private UserAccount account;

    @BeforeEach
    void setUp() {
        helper = new AccountLockoutHelper(userAccountRepository, auditService, AuthTestData.authProperties());
        account = AuthTestData.activeAccount();
    }

    @Test
    void failuresBelowThreshold_onlyCount() {
        for (int i = 1; i <= 4; i++) {
            assertThat(helper.recordFailedAttempt(account, CLIENT, NOW)).isFalse();
            assertThat(account.getFailedLoginAttempts()).isEqualTo(i);
        }
        assertThat(account.getLockedUntil()).isNull();
        verifyNoInteractions(auditService);
    }

    @Test
    void fifthFailure_locksFor15MinutesAndAudits() {
        account.setFailedLoginAttempts(4);

        boolean locked = helper.recordFailedAttempt(account, CLIENT, NOW);

        assertThat(locked).isTrue();
        assertThat(account.getLockedUntil()).isEqualTo(NOW.plus(Duration.ofMinutes(15)));
        assertThat(account.getFailedLoginAttempts()).isZero();
        assertThat(account.isLockedAt(NOW.plusSeconds(899))).isTrue();
        assertThat(account.isLockedAt(NOW.plusSeconds(900))).isFalse();
        verify(auditService).recordForAccount(eq(AuditAction.ACCOUNT_LOCKED), eq(1L), eq(CLIENT), anyMap());
        verify(userAccountRepository).save(account);
    }

    @Test
    void successfulLogin_resetsCounterAndLockAndStampsLastLogin() {
        account.setFailedLoginAttempts(3);
        account.setLockedUntil(NOW.minusSeconds(1));

        helper.recordSuccessfulLogin(account, NOW);

        assertThat(account.getFailedLoginAttempts()).isZero();
        assertThat(account.getLockedUntil()).isNull();
        assertThat(account.getLastLoginAt()).isEqualTo(NOW);
        verify(userAccountRepository).save(account);
    }
}

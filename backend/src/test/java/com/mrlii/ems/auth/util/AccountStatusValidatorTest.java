package com.mrlii.ems.auth.util;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountStatusValidatorTest {

    private static final Instant NOW = Instant.parse("2026-06-01T12:00:00Z");
    private final AccountStatusValidator validator = new AccountStatusValidator();

    private AuthErrorCode codeOf(UserAccount account) {
        try {
            validator.assertUsable(account, NOW);
            return null;
        } catch (AuthException e) {
            return e.getCode();
        }
    }

    @Test
    void activeAccount_isUsable() {
        assertThatCode(() -> validator.assertUsable(AuthTestData.activeAccount(), NOW)).doesNotThrowAnyException();
    }

    @Test
    void accountWithoutEmployee_isUsable() {
        UserAccount account = UserAccount.builder().email("x@y.z").build();
        assertThat(codeOf(account)).isNull();
    }

    @Test
    void pendingEmployee_isUsable() {
        UserAccount account = AuthTestData.activeAccount();
        account.getEmployee().setStatus(CommonStatus.PENDING);
        assertThat(codeOf(account)).isNull();
    }

    @Test
    void disabledAccount_isInactive() {
        UserAccount account = AuthTestData.activeAccount();
        account.setEnabled(false);
        assertThat(codeOf(account)).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
    }

    @Test
    void lockedAccount_isLocked_untilLockExpires() {
        UserAccount account = AuthTestData.activeAccount();
        account.setLockedUntil(NOW.plusSeconds(60));
        assertThat(codeOf(account)).isEqualTo(AuthErrorCode.ACCOUNT_LOCKED);

        account.setLockedUntil(NOW);
        assertThat(codeOf(account)).isNull();
    }

    @Test
    void inactiveEmployee_isDeactivated() {
        UserAccount account = AuthTestData.activeAccount();
        account.getEmployee().setStatus(CommonStatus.INACTIVE);

        assertThatThrownBy(() -> validator.assertUsable(account, NOW))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void archivedOrDeletedEmployee_isNoLongerActive() {
        UserAccount archived = AuthTestData.activeAccount();
        archived.getEmployee().setStatus(CommonStatus.ARCHIVED);
        UserAccount deleted = AuthTestData.activeAccount();
        deleted.getEmployee().setDeletedAt(LocalDateTime.now());

        assertThat(codeOf(archived)).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
        assertThat(codeOf(deleted)).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
    }

    @Test
    void assertEmployeeActive_ignoresLock() {
        UserAccount account = AuthTestData.activeAccount();
        account.setLockedUntil(NOW.plusSeconds(600));

        assertThatCode(() -> validator.assertEmployeeActive(account)).doesNotThrowAnyException();
    }
}

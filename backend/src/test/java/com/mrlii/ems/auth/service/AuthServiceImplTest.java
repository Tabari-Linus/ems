package com.mrlii.ems.auth.service;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.service.AuditService;
import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.ChangePasswordRequest;
import com.mrlii.ems.auth.dto.IssuedSession;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.dto.SetPasswordRequest;
import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.helper.AccountLockoutHelper;
import com.mrlii.ems.auth.helper.AuthServiceHelper;
import com.mrlii.ems.auth.helper.AuthSessionPersistenceHelper;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.impl.AuthServiceImpl;
import com.mrlii.ems.auth.util.AccountStatusValidator;
import com.mrlii.ems.auth.util.PasswordPolicyValidator;
import com.mrlii.ems.common.dto.ClientInfo;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.event.EmployeeAccessChangedEvent;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String PASSWORD = "Correct-Horse-9";
    private static final String NEW_PASSWORD = "Brand-New-Secret-42";
    private static final ClientInfo CLIENT = new ClientInfo("10.0.0.1", "JUnit");
    private static final Instant FAR_FUTURE = Instant.parse("2099-01-01T00:00:00Z");

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private AuthServiceHelper authServiceHelper;
    @Mock private AuthSessionPersistenceHelper sessionHelper;
    @Mock private AccountLockoutHelper lockoutHelper;
    @Mock private OneTimeTokenService oneTimeTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private AuthServiceImpl authService;
    private UserAccount account;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userAccountRepository, authServiceHelper, sessionHelper, lockoutHelper,
                new AccountStatusValidator(), new PasswordPolicyValidator(), oneTimeTokenService,
                passwordEncoder, auditService, eventPublisher);
        account = AuthTestData.activeAccount();
    }

    private IssuedSession issued(UUID family) {
        AuthSession session = AuthSession.builder().id(9L).familyId(family).userAccount(account)
                .expiresAt(FAR_FUTURE).build();
        return new IssuedSession(session, "raw-refresh");
    }

    private void stubTokens() {
        when(authServiceHelper.generateAccessToken(eq(account), any(), any())).thenReturn("access");
        when(authServiceHelper.accessTokenExpiresAt(any())).thenReturn(FAR_FUTURE);
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_validCredentials_startsNewSessionFamily() {
        when(userAccountRepository.findByEmailWithAccess("ama@example.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(PASSWORD, "hash")).thenReturn(true);
        when(sessionHelper.start(eq(account), eq(CLIENT), any())).thenReturn(issued(UUID.randomUUID()));
        stubTokens();

        AuthTokenPair pair = authService.login(new LoginRequest("  AMA@Example.COM ", PASSWORD), CLIENT);

        assertThat(pair.accessToken()).isEqualTo("access");
        assertThat(pair.refreshToken()).isEqualTo("raw-refresh");
        assertThat(pair.refreshTokenExpiresAt()).isEqualTo(FAR_FUTURE);
        verify(lockoutHelper).recordSuccessfulLogin(eq(account), any());
        verify(auditService).recordForAccount(eq(AuditAction.LOGIN_SUCCEEDED), eq(1L), eq(CLIENT), anyMap());
    }

    @Test
    void login_unknownEmail_isInvalidCredentialsAndAudited() {
        when(userAccountRepository.findByEmailWithAccess("nobody@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("dummy");
        LoginRequest request = new LoginRequest("nobody@example.com", PASSWORD);

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .isInstanceOf(AuthException.class)
                .extracting("code").isEqualTo(AuthErrorCode.INVALID_CREDENTIALS);
        verify(passwordEncoder).matches(PASSWORD, "dummy");
        verify(auditService).record(eq(AuditAction.LOGIN_FAILED), isNull(), any(), isNull(), eq(CLIENT), anyMap());
    }

    @Test
    void login_wrongPassword_countsFailureAndRejects() {
        when(userAccountRepository.findByEmailWithAccess(anyString())).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);
        when(lockoutHelper.recordFailedAttempt(eq(account), eq(CLIENT), any())).thenReturn(false);
        LoginRequest request = new LoginRequest("ama@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.INVALID_CREDENTIALS);
        verify(sessionHelper, never()).start(any(), any(), any());
    }

    @Test
    void login_fifthWrongPassword_reportsLocked() {
        when(userAccountRepository.findByEmailWithAccess(anyString())).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);
        when(lockoutHelper.recordFailedAttempt(eq(account), eq(CLIENT), any())).thenReturn(true);
        LoginRequest request = new LoginRequest("ama@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_LOCKED);
    }

    @Test
    void login_lockedAccount_rejectedEvenWithCorrectPassword() {
        account.setLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));
        when(userAccountRepository.findByEmailWithAccess(anyString())).thenReturn(Optional.of(account));
        LoginRequest request = new LoginRequest("ama@example.com", PASSWORD);

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_LOCKED);
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void login_pendingWithoutPassword_isRefusedWithClearMessage() {
        account.setPasswordHash(null);
        account.getEmployee().setStatus(CommonStatus.PENDING);
        when(userAccountRepository.findByEmailWithAccess(anyString())).thenReturn(Optional.of(account));
        LoginRequest request = new LoginRequest("ama@example.com", PASSWORD);

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("welcome email")
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_PENDING);
    }

    @Test
    void login_inactiveEmployee_isRefusedAfterPasswordCheck() {
        account.getEmployee().setStatus(CommonStatus.INACTIVE);
        when(userAccountRepository.findByEmailWithAccess(anyString())).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(PASSWORD, "hash")).thenReturn(true);
        LoginRequest request = new LoginRequest("ama@example.com", PASSWORD);

        assertThatThrownBy(() -> authService.login(request, CLIENT))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("deactivated")
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
        verify(auditService).recordForAccount(eq(AuditAction.LOGIN_FAILED), eq(1L), eq(CLIENT), anyMap());
        verify(sessionHelper, never()).start(any(), any(), any());
    }

    // ── refresh ───────────────────────────────────────────────────────────────

    private AuthSession storedSession(UUID family) {
        return AuthSession.builder().id(5L).familyId(family).userAccount(account).expiresAt(FAR_FUTURE).build();
    }

    @Test
    void refresh_activeSession_rotatesWithinFamily() {
        UUID family = UUID.randomUUID();
        AuthSession current = storedSession(family);
        when(sessionHelper.findByRawToken("raw")).thenReturn(Optional.of(current));
        when(userAccountRepository.findByIdWithAccess(1L)).thenReturn(Optional.of(account));
        when(sessionHelper.rotate(eq(current), eq(CLIENT), any())).thenReturn(issued(family));
        stubTokens();

        AuthTokenPair pair = authService.refresh("raw", CLIENT);

        assertThat(pair.refreshToken()).isEqualTo("raw-refresh");
        verify(authServiceHelper).generateAccessToken(eq(account), eq(family), any());
    }

    @Test
    void refresh_unknownToken_isTokenInvalid() {
        when(sessionHelper.findByRawToken("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("nope", CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.TOKEN_INVALID);
    }

    @Test
    void refresh_revokedToken_revokesWholeFamilyAndAudits() {
        UUID family = UUID.randomUUID();
        AuthSession reused = storedSession(family);
        reused.setRevokedAt(Instant.now());
        reused.setRevokedReason(SessionRevocationReason.ROTATED);
        when(sessionHelper.findByRawToken("old")).thenReturn(Optional.of(reused));
        when(sessionHelper.revokeFamily(eq(family), eq(SessionRevocationReason.REUSE_DETECTED), any())).thenReturn(1);

        assertThatThrownBy(() -> authService.refresh("old", CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.TOKEN_INVALID);
        verify(auditService).record(eq(AuditAction.SESSION_REUSE_DETECTED), eq(1L),
                eq(AuditService.TARGET_SESSION_FAMILY), eq(family.toString()), eq(CLIENT), anyMap());
        verify(sessionHelper, never()).rotate(any(), any(), any());
    }

    @Test
    void refresh_expiredSession_isTokenExpired() {
        AuthSession expired = storedSession(UUID.randomUUID());
        expired.setExpiresAt(Instant.now().minusSeconds(1));
        when(sessionHelper.findByRawToken("raw")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refresh("raw", CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.TOKEN_EXPIRED);
        verify(sessionHelper).revokeFamily(eq(expired.getFamilyId()), eq(SessionRevocationReason.EXPIRED), any());
    }

    @Test
    void refresh_archivedEmployee_isRefusedAndFamilyRevoked() {
        AuthSession current = storedSession(UUID.randomUUID());
        account.getEmployee().setStatus(CommonStatus.ARCHIVED);
        when(sessionHelper.findByRawToken("raw")).thenReturn(Optional.of(current));
        when(userAccountRepository.findByIdWithAccess(1L)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> authService.refresh("raw", CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
        verify(sessionHelper).revokeFamily(eq(current.getFamilyId()), eq(SessionRevocationReason.ACCOUNT_INACTIVE), any());
    }

    // ── logout / logout-all ───────────────────────────────────────────────────

    @Test
    void logout_knownToken_revokesItsFamily() {
        AuthSession current = storedSession(UUID.randomUUID());
        when(sessionHelper.findByRawToken("raw")).thenReturn(Optional.of(current));

        authService.logout("raw", CLIENT);

        verify(sessionHelper).revokeFamily(eq(current.getFamilyId()), eq(SessionRevocationReason.LOGOUT), any());
        verify(auditService).recordForAccount(eq(AuditAction.LOGOUT), eq(1L), eq(CLIENT), anyMap());
    }

    @Test
    void logout_unknownToken_isNoOp() {
        when(sessionHelper.findByRawToken("raw")).thenReturn(Optional.empty());

        authService.logout("raw", CLIENT);

        verifyNoInteractions(auditService);
    }

    @Test
    void logoutAll_revokesEverySessionOfAccount() {
        when(sessionHelper.revokeAllOfAccount(eq(1L), eq(SessionRevocationReason.LOGOUT_ALL), any())).thenReturn(3);

        authService.logoutAll(1L, CLIENT);

        verify(auditService).recordForAccount(eq(AuditAction.LOGOUT_ALL), eq(1L), eq(CLIENT), anyMap());
    }

    // ── set-password ──────────────────────────────────────────────────────────

    private OneTimeToken welcomeToken() {
        return OneTimeToken.builder().id(4L).userAccount(account).purpose(OneTimeTokenPurpose.WELCOME)
                .expiresAt(FAR_FUTURE).build();
    }

    @Test
    void setPassword_validToken_setsPasswordActivatesPendingAndRevokesSessions() {
        account.setPasswordHash(null);
        account.setFailedLoginAttempts(3);
        account.getEmployee().setStatus(CommonStatus.PENDING);
        OneTimeToken token = welcomeToken();
        when(oneTimeTokenService.findRedeemable(eq("tok"), any())).thenReturn(token);
        when(userAccountRepository.findByIdWithAccess(1L)).thenReturn(Optional.of(account));
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("new-hash");

        authService.setPassword(new SetPasswordRequest("tok", NEW_PASSWORD), CLIENT);

        assertThat(account.getPasswordHash()).isEqualTo("new-hash");
        assertThat(account.getFailedLoginAttempts()).isZero();
        assertThat(account.getEmployee().getStatus()).isEqualTo(CommonStatus.ACTIVE);
        verify(oneTimeTokenService).markUsed(eq(token), any());
        verify(eventPublisher).publishEvent(new EmployeeAccessChangedEvent(5L, CommonStatus.ACTIVE));
        verify(sessionHelper).revokeAllOfAccount(eq(1L), eq(SessionRevocationReason.PASSWORD_SET), any());
        verify(auditService).recordForAccount(eq(AuditAction.PASSWORD_SET), eq(1L), eq(CLIENT), anyMap());
    }

    @Test
    void setPassword_weakPassword_doesNotConsumeToken() {
        when(oneTimeTokenService.findRedeemable(eq("tok"), any())).thenReturn(welcomeToken());
        when(userAccountRepository.findByIdWithAccess(1L)).thenReturn(Optional.of(account));
        SetPasswordRequest request = new SetPasswordRequest("tok", "short");

        assertThatThrownBy(() -> authService.setPassword(request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.PASSWORD_POLICY);
        verify(oneTimeTokenService, never()).markUsed(any(), any());
    }

    @Test
    void setPassword_archivedEmployee_isRefused() {
        account.getEmployee().setStatus(CommonStatus.ARCHIVED);
        when(oneTimeTokenService.findRedeemable(eq("tok"), any())).thenReturn(welcomeToken());
        when(userAccountRepository.findByIdWithAccess(1L)).thenReturn(Optional.of(account));
        SetPasswordRequest request = new SetPasswordRequest("tok", NEW_PASSWORD);

        assertThatThrownBy(() -> authService.setPassword(request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
    }

    // ── change-password ───────────────────────────────────────────────────────

    @Test
    void changePassword_correctCurrent_revokesOtherSessions() {
        UUID family = UUID.randomUUID();
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(PASSWORD, "hash")).thenReturn(true);
        when(passwordEncoder.matches(NEW_PASSWORD, "hash")).thenReturn(false);
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("new-hash");

        authService.changePassword(1L, family, new ChangePasswordRequest(PASSWORD, NEW_PASSWORD), CLIENT);

        assertThat(account.getPasswordHash()).isEqualTo("new-hash");
        verify(sessionHelper).revokeOtherSessions(eq(1L), eq(family), eq(SessionRevocationReason.PASSWORD_CHANGED), any());
        verify(auditService).recordForAccount(eq(AuditAction.PASSWORD_CHANGED), eq(1L), eq(CLIENT), anyMap());
    }

    @Test
    void changePassword_wrongCurrent_is400InvalidCredentials() {
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);
        ChangePasswordRequest request = new ChangePasswordRequest("bad", NEW_PASSWORD);

        assertThatThrownBy(() -> authService.changePassword(1L, null, request, CLIENT))
                .isInstanceOf(AuthException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void changePassword_sameAsCurrent_violatesPolicy() {
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(NEW_PASSWORD, "hash")).thenReturn(true);
        ChangePasswordRequest request = new ChangePasswordRequest(NEW_PASSWORD, NEW_PASSWORD);

        assertThatThrownBy(() -> authService.changePassword(1L, null, request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.PASSWORD_POLICY);
    }

    @Test
    void changePassword_missingAccount_isUnauthenticated() {
        when(userAccountRepository.findById(1L)).thenReturn(Optional.empty());
        ChangePasswordRequest request = new ChangePasswordRequest(PASSWORD, NEW_PASSWORD);

        assertThatThrownBy(() -> authService.changePassword(1L, null, request, CLIENT))
                .extracting("code").isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }

    // ── revokeSessionsOfEmployee ──────────────────────────────────────────────

    @Test
    void revokeSessionsOfEmployee_revokesAccountSessions() {
        when(userAccountRepository.findByEmployee_Id(5L)).thenReturn(Optional.of(account));
        when(sessionHelper.revokeAllOfAccount(eq(1L), eq(SessionRevocationReason.ACCOUNT_INACTIVE), any())).thenReturn(2);

        assertThat(authService.revokeSessionsOfEmployee(5L)).isEqualTo(2);
    }

    @Test
    void revokeSessionsOfEmployee_withoutAccount_returnsZero() {
        when(userAccountRepository.findByEmployee_Id(5L)).thenReturn(Optional.empty());

        assertThat(authService.revokeSessionsOfEmployee(5L)).isZero();
    }
}

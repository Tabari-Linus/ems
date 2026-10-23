package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.service.AuditService;
import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.ChangePasswordRequest;
import com.mrlii.ems.auth.dto.IssuedSession;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.dto.SetPasswordRequest;
import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.helper.AccountLockoutHelper;
import com.mrlii.ems.auth.helper.AuthServiceHelper;
import com.mrlii.ems.auth.helper.AuthSessionPersistenceHelper;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.auth.service.OneTimeTokenService;
import com.mrlii.ems.auth.util.AccountStatusValidator;
import com.mrlii.ems.auth.util.EmailNormalizer;
import com.mrlii.ems.auth.util.PasswordPolicyValidator;
import com.mrlii.ems.common.dto.ClientInfo;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.event.EmployeeAccessChangedEvent;
import com.mrlii.ems.organization.employee.entity.Employee;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Login, refresh rotation with reuse detection, logout, password set/change.
 * <p>
 * Failure paths deliberately commit their side effects (failed-attempt counter, lockout, family
 * revocation on reuse, audit rows), hence {@code noRollbackFor = AuthException.class}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    static final String NEW_PASSWORD_FIELD = "newPassword";
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
    private static final String REASON = "reason";

    private final UserAccountRepository userAccountRepository;
    private final AuthServiceHelper authServiceHelper;
    private final AuthSessionPersistenceHelper sessionHelper;
    private final AccountLockoutHelper lockoutHelper;
    private final AccountStatusValidator accountStatusValidator;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final OneTimeTokenService oneTimeTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    /** BCrypt hash compared against when the email is unknown, so timing does not reveal accounts. */
    private volatile String timingEqualizerHash;

    @Override
    @Transactional(noRollbackFor = AuthException.class)
    public AuthTokenPair login(LoginRequest request, ClientInfo client) {
        Instant now = Instant.now();
        String email = EmailNormalizer.normalize(request.email());
        UserAccount account = userAccountRepository.findByEmailWithAccess(email).orElse(null);

        if (account == null) {
            passwordEncoder.matches(request.password(), timingEqualizerHash());
            auditService.record(AuditAction.LOGIN_FAILED, null, AuditService.TARGET_USER_ACCOUNT, null, client,
                    Map.of("email", email, REASON, "UNKNOWN_EMAIL"));
            throw invalidCredentials();
        }
        if (account.isLockedAt(now)) {
            auditLoginFailed(account, client, AuthErrorCode.ACCOUNT_LOCKED.name());
            throw new AuthException(AuthErrorCode.ACCOUNT_LOCKED, AccountStatusValidator.lockedMessage());
        }
        if (!account.hasPassword()) {
            auditLoginFailed(account, client, "PASSWORD_NOT_SET");
            throw new AuthException(AuthErrorCode.ACCOUNT_PENDING,
                    "Your account is not set up yet. Use the link in your welcome email to choose a password.");
        }
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            auditLoginFailed(account, client, "BAD_PASSWORD");
            if (lockoutHelper.recordFailedAttempt(account, client, now)) {
                throw new AuthException(AuthErrorCode.ACCOUNT_LOCKED, AccountStatusValidator.lockedMessage());
            }
            throw invalidCredentials();
        }
        try {
            accountStatusValidator.assertUsable(account, now);
        } catch (AuthException e) {
            auditLoginFailed(account, client, e.getCode().name());
            throw e;
        }

        lockoutHelper.recordSuccessfulLogin(account, now);
        IssuedSession issued = sessionHelper.start(account, client, now);
        auditService.recordForAccount(AuditAction.LOGIN_SUCCEEDED, account.getId(), client,
                Map.of("sessionFamily", issued.session().getFamilyId().toString()));
        return tokenPair(account, issued, now);
    }

    @Override
    @Transactional(noRollbackFor = AuthException.class)
    public AuthTokenPair refresh(String refreshToken, ClientInfo client) {
        Instant now = Instant.now();
        AuthSession session = sessionHelper.findByRawToken(refreshToken)
                .orElseThrow(() -> new AuthException(AuthErrorCode.TOKEN_INVALID, "Your session is not valid. Please sign in."));
        Long accountId = session.getUserAccount().getId();

        if (session.isRevoked()) {
            int revoked = sessionHelper.revokeFamily(session.getFamilyId(), SessionRevocationReason.REUSE_DETECTED, now);
            auditService.record(AuditAction.SESSION_REUSE_DETECTED, accountId,
                    AuditService.TARGET_SESSION_FAMILY, session.getFamilyId().toString(), client,
                    Map.of("sessionId", session.getId(),
                            "previousRevocation", String.valueOf(session.getRevokedReason()),
                            "revokedSessions", revoked));
            log.warn("Refresh token reuse detected: account id={}, family={}", accountId, session.getFamilyId());
            throw new AuthException(AuthErrorCode.TOKEN_INVALID, "Your session has ended. Please sign in again.");
        }
        if (session.isExpiredAt(now)) {
            sessionHelper.revokeFamily(session.getFamilyId(), SessionRevocationReason.EXPIRED, now);
            throw new AuthException(AuthErrorCode.TOKEN_EXPIRED, "Your session has expired. Please sign in again.");
        }

        UserAccount account = userAccountRepository.findByIdWithAccess(accountId)
                .orElseThrow(() -> new AuthException(AuthErrorCode.TOKEN_INVALID, "Your session is not valid. Please sign in."));
        try {
            accountStatusValidator.assertUsable(account, now);
        } catch (AuthException e) {
            sessionHelper.revokeFamily(session.getFamilyId(), SessionRevocationReason.ACCOUNT_INACTIVE, now);
            throw e;
        }

        IssuedSession rotated = sessionHelper.rotate(session, client, now);
        return tokenPair(account, rotated, now);
    }

    @Override
    @Transactional
    public void logout(String refreshToken, ClientInfo client) {
        sessionHelper.findByRawToken(refreshToken).ifPresent(session -> {
            int revoked = sessionHelper.revokeFamily(session.getFamilyId(), SessionRevocationReason.LOGOUT, Instant.now());
            auditService.recordForAccount(AuditAction.LOGOUT, session.getUserAccount().getId(), client,
                    Map.of("sessionFamily", session.getFamilyId().toString(), "revokedSessions", revoked));
        });
    }

    @Override
    @Transactional
    public void logoutAll(Long accountId, ClientInfo client) {
        int revoked = sessionHelper.revokeAllOfAccount(accountId, SessionRevocationReason.LOGOUT_ALL, Instant.now());
        auditService.recordForAccount(AuditAction.LOGOUT_ALL, accountId, client, Map.of("revokedSessions", revoked));
    }

    @Override
    @Transactional(noRollbackFor = AuthException.class)
    public void setPassword(SetPasswordRequest request, ClientInfo client) {
        Instant now = Instant.now();
        OneTimeToken token = oneTimeTokenService.findRedeemable(request.token(), now);
        UserAccount account = userAccountRepository.findByIdWithAccess(token.getUserAccount().getId())
                .orElseThrow(() -> new AuthException(AuthErrorCode.TOKEN_INVALID, HttpStatus.BAD_REQUEST,
                        "This link is invalid."));
        accountStatusValidator.assertEmployeeActive(account);
        passwordPolicyValidator.validate(request.newPassword(), account.getEmail(), NEW_PASSWORD_FIELD);

        oneTimeTokenService.markUsed(token, now);
        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        account.setPasswordChangedAt(now);
        account.setFailedLoginAttempts(0);
        account.setLockedUntil(null);
        userAccountRepository.save(account);

        Employee employee = account.getEmployee();
        if (employee != null && employee.getStatus() == CommonStatus.PENDING) {
            employee.setStatus(CommonStatus.ACTIVE);
            eventPublisher.publishEvent(new EmployeeAccessChangedEvent(employee.getId(), CommonStatus.ACTIVE));
        }
        int revoked = sessionHelper.revokeAllOfAccount(account.getId(), SessionRevocationReason.PASSWORD_SET, now);
        auditService.recordForAccount(AuditAction.PASSWORD_SET, account.getId(), client,
                Map.of("purpose", token.getPurpose().name(), "revokedSessions", revoked));
    }

    @Override
    @Transactional(noRollbackFor = AuthException.class)
    public void changePassword(Long accountId, UUID currentSessionFamilyId,
                               ChangePasswordRequest request, ClientInfo client) {
        Instant now = Instant.now();
        UserAccount account = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new AuthException(AuthErrorCode.UNAUTHENTICATED, "Authentication is required"));
        if (!account.hasPassword() || !passwordEncoder.matches(request.currentPassword(), account.getPasswordHash())) {
            throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST,
                    "The current password is incorrect");
        }
        passwordPolicyValidator.validate(request.newPassword(), account.getEmail(), NEW_PASSWORD_FIELD);
        if (passwordEncoder.matches(request.newPassword(), account.getPasswordHash())) {
            throw new AuthException(AuthErrorCode.PASSWORD_POLICY, HttpStatus.BAD_REQUEST,
                    "The password does not meet the password policy",
                    List.of(new Violation(NEW_PASSWORD_FIELD, "The new password must differ from the current one")));
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        account.setPasswordChangedAt(now);
        userAccountRepository.save(account);
        int revoked = sessionHelper.revokeOtherSessions(accountId, currentSessionFamilyId,
                SessionRevocationReason.PASSWORD_CHANGED, now);
        auditService.recordForAccount(AuditAction.PASSWORD_CHANGED, accountId, client,
                Map.of("revokedSessions", revoked));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int revokeSessionsOfEmployee(Long employeeId) {
        return userAccountRepository.findByEmployee_Id(employeeId)
                .map(account -> sessionHelper.revokeAllOfAccount(account.getId(),
                        SessionRevocationReason.ACCOUNT_INACTIVE, Instant.now()))
                .orElse(0);
    }

    private AuthTokenPair tokenPair(UserAccount account, IssuedSession issued, Instant now) {
        return new AuthTokenPair(
                authServiceHelper.generateAccessToken(account, issued.session().getFamilyId(), now),
                authServiceHelper.accessTokenExpiresAt(now),
                issued.rawToken(),
                issued.session().getExpiresAt());
    }

    private void auditLoginFailed(UserAccount account, ClientInfo client, String reason) {
        auditService.recordForAccount(AuditAction.LOGIN_FAILED, account.getId(), client, Map.of(REASON, reason));
    }

    private static AuthException invalidCredentials() {
        return new AuthException(AuthErrorCode.INVALID_CREDENTIALS, INVALID_CREDENTIALS_MESSAGE);
    }

    private String timingEqualizerHash() {
        String hash = timingEqualizerHash;
        if (hash == null) {
            hash = passwordEncoder.encode(UUID.randomUUID().toString());
            timingEqualizerHash = hash;
        }
        return hash;
    }
}

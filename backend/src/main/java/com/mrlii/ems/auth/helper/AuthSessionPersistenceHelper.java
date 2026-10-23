package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.dto.IssuedSession;
import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import com.mrlii.ems.auth.repository.AuthSessionRepository;
import com.mrlii.ems.auth.util.TokenHasher;
import com.mrlii.ems.common.dto.ClientInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Persistence of refresh sessions: start, rotate, look up by raw token, revoke. */
@Component
@RequiredArgsConstructor
public class AuthSessionPersistenceHelper {

    private final AuthSessionRepository authSessionRepository;
    private final TokenHasher tokenHasher;
    private final AuthServiceHelper authServiceHelper;

    /** Starts a new session family (a login on some device). */
    public IssuedSession start(UserAccount account, ClientInfo client, Instant now) {
        return create(account, UUID.randomUUID(), client, now);
    }

    /** Replaces {@code current} with a new generation in the same family and revokes {@code current}. */
    public IssuedSession rotate(AuthSession current, ClientInfo client, Instant now) {
        IssuedSession next = create(current.getUserAccount(), current.getFamilyId(), client, now);
        current.setRevokedAt(now);
        current.setRevokedReason(SessionRevocationReason.ROTATED);
        current.setReplacedBy(next.session().getId());
        current.setLastUsedAt(now);
        authSessionRepository.save(current);
        return next;
    }

    /** Finds the session of a raw refresh token, row-locked for the rest of the transaction. */
    public Optional<AuthSession> findByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        return authSessionRepository.findByTokenHash(tokenHasher.hash(rawToken));
    }

    public int revokeFamily(UUID familyId, SessionRevocationReason reason, Instant now) {
        return authSessionRepository.revokeFamily(familyId, reason, now);
    }

    public int revokeAllOfAccount(Long accountId, SessionRevocationReason reason, Instant now) {
        return authSessionRepository.revokeAllOfAccount(accountId, reason, now);
    }

    /** Revokes every session of the account except those of {@code keepFamilyId} (the caller's own). */
    public int revokeOtherSessions(Long accountId, UUID keepFamilyId, SessionRevocationReason reason, Instant now) {
        if (keepFamilyId == null) {
            return revokeAllOfAccount(accountId, reason, now);
        }
        return authSessionRepository.revokeAllOfAccountExceptFamily(accountId, keepFamilyId, reason, now);
    }

    private IssuedSession create(UserAccount account, UUID familyId, ClientInfo client, Instant now) {
        String rawToken = tokenHasher.generate();
        ClientInfo origin = client == null ? ClientInfo.UNKNOWN : client;
        AuthSession session = AuthSession.builder()
                .userAccount(account)
                .familyId(familyId)
                .tokenHash(tokenHasher.hash(rawToken))
                .userAgent(origin.userAgent())
                .ip(origin.ip())
                .createdAt(now)
                .lastUsedAt(now)
                .expiresAt(authServiceHelper.refreshTokenExpiresAt(now))
                .build();
        return new IssuedSession(authSessionRepository.save(session), rawToken);
    }
}

package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.dto.IssuedSession;
import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import com.mrlii.ems.auth.repository.AuthSessionRepository;
import com.mrlii.ems.auth.util.TokenHasher;
import com.mrlii.ems.common.dto.ClientInfo;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthSessionPersistenceHelperTest {

    private static final Instant NOW = Instant.parse("2026-06-01T12:00:00Z");
    private static final Instant EXPIRY = NOW.plusSeconds(604_800);

    @Mock private AuthSessionRepository repository;
    @Mock private AuthServiceHelper authServiceHelper;

    private final TokenHasher tokenHasher = new TokenHasher();
    private AuthSessionPersistenceHelper helper;
    private UserAccount account;

    @BeforeEach
    void setUp() {
        helper = new AuthSessionPersistenceHelper(repository, tokenHasher, authServiceHelper);
        account = AuthTestData.activeAccount();
    }

    private void stubSave() {
        AtomicLong ids = new AtomicLong(100);
        when(authServiceHelper.refreshTokenExpiresAt(NOW)).thenReturn(EXPIRY);
        when(repository.save(any(AuthSession.class))).thenAnswer(inv -> {
            AuthSession s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(ids.incrementAndGet());
            }
            return s;
        });
    }

    @Test
    void start_createsNewFamilyStoringOnlyTheHash() {
        stubSave();

        IssuedSession issued = helper.start(account, new ClientInfo("1.1.1.1", "Firefox"), NOW);

        AuthSession session = issued.session();
        assertThat(session.getFamilyId()).isNotNull();
        assertThat(session.getTokenHash()).isEqualTo(tokenHasher.hash(issued.rawToken()));
        assertThat(session.getTokenHash()).isNotEqualTo(issued.rawToken());
        assertThat(session.getIp()).isEqualTo("1.1.1.1");
        assertThat(session.getUserAgent()).isEqualTo("Firefox");
        assertThat(session.getExpiresAt()).isEqualTo(EXPIRY);
        assertThat(session.isRevoked()).isFalse();
        assertThat(issued.toString()).doesNotContain(issued.rawToken());
    }

    @Test
    void start_twice_createsDistinctFamilies() {
        stubSave();

        UUID first = helper.start(account, null, NOW).session().getFamilyId();
        UUID second = helper.start(account, null, NOW).session().getFamilyId();

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    void rotate_keepsFamilyAndRevokesCurrent() {
        stubSave();
        UUID family = UUID.randomUUID();
        AuthSession current = AuthSession.builder().id(1L).userAccount(account).familyId(family)
                .tokenHash("old").expiresAt(EXPIRY).build();

        IssuedSession next = helper.rotate(current, ClientInfo.UNKNOWN, NOW);

        assertThat(next.session().getFamilyId()).isEqualTo(family);
        assertThat(current.getRevokedAt()).isEqualTo(NOW);
        assertThat(current.getRevokedReason()).isEqualTo(SessionRevocationReason.ROTATED);
        assertThat(current.getReplacedBy()).isEqualTo(next.session().getId());
        assertThat(next.rawToken()).isNotBlank();
    }

    @Test
    void findByRawToken_looksUpByHash() {
        AuthSession stored = AuthSession.builder().id(1L).build();
        when(repository.findByTokenHash(tokenHasher.hash("raw"))).thenReturn(Optional.of(stored));

        assertThat(helper.findByRawToken("raw")).contains(stored);
        assertThat(helper.findByRawToken(" ")).isEmpty();
        assertThat(helper.findByRawToken(null)).isEmpty();
    }

    @Test
    void revokeHelpers_delegateToBulkUpdates() {
        UUID family = UUID.randomUUID();
        when(repository.revokeFamily(family, SessionRevocationReason.LOGOUT, NOW)).thenReturn(1);
        when(repository.revokeAllOfAccount(1L, SessionRevocationReason.LOGOUT_ALL, NOW)).thenReturn(2);
        when(repository.revokeAllOfAccountExceptFamily(1L, family, SessionRevocationReason.PASSWORD_CHANGED, NOW))
                .thenReturn(3);

        assertThat(helper.revokeFamily(family, SessionRevocationReason.LOGOUT, NOW)).isEqualTo(1);
        assertThat(helper.revokeAllOfAccount(1L, SessionRevocationReason.LOGOUT_ALL, NOW)).isEqualTo(2);
        assertThat(helper.revokeOtherSessions(1L, family, SessionRevocationReason.PASSWORD_CHANGED, NOW)).isEqualTo(3);
    }

    @Test
    void revokeOtherSessions_withoutCurrentFamily_revokesAll() {
        when(repository.revokeAllOfAccount(1L, SessionRevocationReason.PASSWORD_CHANGED, NOW)).thenReturn(4);

        assertThat(helper.revokeOtherSessions(1L, null, SessionRevocationReason.PASSWORD_CHANGED, NOW)).isEqualTo(4);
    }
}

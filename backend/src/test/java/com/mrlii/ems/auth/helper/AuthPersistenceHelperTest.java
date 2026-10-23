package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.RefreshTokenRepository;
import com.mrlii.ems.common.config.RsaKeyProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthPersistenceHelperTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private RsaKeyProperties rsaKeyProperties;

    @InjectMocks private AuthPersistenceHelper authPersistenceHelper;

    private static final long REFRESH_EXPIRATION_MS = 86400000L;
    private static final Instant FUTURE_EXPIRY = Instant.parse("2099-12-31T23:59:59Z");
    private static final Instant PAST_EXPIRY   = Instant.parse("2000-01-01T00:00:00Z");
    private UserAccount userAccount;

    @BeforeEach
    void setUp() {
        userAccount = UserAccount.builder()
                .id(1L)
                .userId(UUID.randomUUID())
                .email("user@example.com")
                .enabled(true)
                .build();
    }

    // ── rotateRefreshToken ────────────────────────────────────────────────────

    @Test
    void rotateRefreshToken_deletesOldAndSavesNew() {
        when(rsaKeyProperties.refreshExpirationMs()).thenReturn(REFRESH_EXPIRATION_MS);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);

        RefreshToken result = authPersistenceHelper.rotateRefreshToken(userAccount);

        verify(refreshTokenRepository).deleteByUserAccount(userAccount);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        assertThat(result.getToken()).isNotNull();
        assertThat(result.getExpiryDate()).isAfter(PAST_EXPIRY);
        assertThat(result.getUserAccount()).isEqualTo(userAccount);
    }

    // ── findValidRefreshToken ─────────────────────────────────────────────────

    @Test
    void findValidRefreshToken_validToken_returnsToken() {
        RefreshToken token = RefreshToken.builder()
                .token("valid-token")
                .userAccount(userAccount)
                .expiryDate(FUTURE_EXPIRY)
                .build();
        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        RefreshToken result = authPersistenceHelper.findValidRefreshToken("valid-token");

        assertThat(result).isEqualTo(token);
    }

    @Test
    void findValidRefreshToken_unknownToken_throws401() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authPersistenceHelper.findValidRefreshToken("unknown"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void findValidRefreshToken_expiredToken_deletesAndThrows401() {
        RefreshToken expired = RefreshToken.builder()
                .token("expired-token")
                .userAccount(userAccount)
                .expiryDate(PAST_EXPIRY)
                .build();
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authPersistenceHelper.findValidRefreshToken("expired-token"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));

        verify(refreshTokenRepository).delete(expired);
    }

    @Test
    void findValidRefreshToken_nullUserAccount_throws401() {
        RefreshToken orphan = RefreshToken.builder()
                .token("orphan-token")
                .userAccount(null)
                .expiryDate(FUTURE_EXPIRY)
                .build();
        when(refreshTokenRepository.findByToken("orphan-token")).thenReturn(Optional.of(orphan));

        assertThatThrownBy(() -> authPersistenceHelper.findValidRefreshToken("orphan-token"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    // ── deleteRefreshToken ────────────────────────────────────────────────────

    @Test
    void deleteRefreshToken_existingToken_deletesIt() {
        RefreshToken token = RefreshToken.builder()
                .token("valid-token")
                .userAccount(userAccount)
                .expiryDate(FUTURE_EXPIRY)
                .build();
        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        authPersistenceHelper.deleteRefreshToken("valid-token");

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void deleteRefreshToken_unknownToken_doesNotThrow() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        authPersistenceHelper.deleteRefreshToken("unknown");

        verify(refreshTokenRepository, never()).delete(any());
    }
}

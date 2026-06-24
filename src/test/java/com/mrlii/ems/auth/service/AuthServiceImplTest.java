package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.RefreshTokenRepository;
import com.mrlii.ems.auth.service.impl.AuthServiceImpl;
import com.mrlii.ems.common.config.RsaKeyProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtEncoder jwtEncoder;
    @Mock private RsaKeyProperties rsaKeyProperties;

    @InjectMocks private AuthServiceImpl authService;

    private static final String EMAIL = "user@example.com";
    private static final String RAW_PASSWORD = "secret";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final long EXPIRATION_MS = 3600000L;
    private static final long REFRESH_EXPIRATION_MS = 86400000L;

    private UserAccount userAccount;

    @BeforeEach
    void setUp() {
        userAccount = UserAccount.builder()
                .id(1L)
                .userId(USER_ID)
                .email(EMAIL)
                .enabled(true)
                .build();
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_validCredentials_returnsTokenPairWithRefreshToken() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userAccount);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        when(rsaKeyProperties.refreshExpirationMs()).thenReturn(REFRESH_EXPIRATION_MS);

        Jwt jwt = Jwt.withTokenValue("access-token")
                .header("alg", "RS256")
                .subject(USER_ID.toString())
                .build();
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);

        var request = new LoginRequest(EMAIL, RAW_PASSWORD);
        AuthTokenPair pair = authService.login(request);

        assertThat(pair.accessToken()).isEqualTo("access-token");
        assertThat(pair.refreshToken()).isNotNull();
        assertThat(pair.refreshTokenExpiresAt()).isAfter(Instant.now());
        verify(refreshTokenRepository).deleteByUserAccount(userAccount);
    }

    // ── refreshToken ──────────────────────────────────────────────────────────

    @Test
    void refreshToken_validToken_returnsNewPairWithRotatedRefreshToken() {
        String oldToken = "old-refresh-token";
        RefreshToken existing = RefreshToken.builder()
                .token(oldToken)
                .userAccount(userAccount)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken(oldToken)).thenReturn(Optional.of(existing));
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        when(rsaKeyProperties.refreshExpirationMs()).thenReturn(REFRESH_EXPIRATION_MS);

        Jwt jwt = Jwt.withTokenValue("new-access-token")
                .header("alg", "RS256")
                .subject(USER_ID.toString())
                .build();
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);

        AuthTokenPair pair = authService.refreshToken(oldToken);

        assertThat(pair.accessToken()).isEqualTo("new-access-token");
        assertThat(pair.refreshToken()).isNotNull();
        verify(refreshTokenRepository).deleteByUserAccount(userAccount);
    }

    @Test
    void refreshToken_expiredToken_throws401AndDeletesToken() {
        String expiredToken = "expired-refresh-token";
        RefreshToken expired = RefreshToken.builder()
                .token(expiredToken)
                .userAccount(userAccount)
                .expiryDate(Instant.now().minusSeconds(100))
                .build();

        when(refreshTokenRepository.findByToken(expiredToken)).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refreshToken(expiredToken))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));

        verify(refreshTokenRepository).delete(expired);
    }

    @Test
    void refreshToken_unknownToken_throws401() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken("unknown"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void refreshToken_tokenWithNullUserAccount_throws401() {
        String orphanToken = "orphan-refresh-token";
        RefreshToken orphan = RefreshToken.builder()
                .token(orphanToken)
                .userAccount(null)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken(orphanToken)).thenReturn(Optional.of(orphan));

        assertThatThrownBy(() -> authService.refreshToken(orphanToken))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    // ── logout ────────────────────────────────────────────────────────────────

    @Test
    void logout_validToken_deletesRefreshToken() {
        RefreshToken token = RefreshToken.builder()
                .token("valid-token")
                .userAccount(userAccount)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        authService.logout("valid-token");

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void logout_unknownToken_doesNotThrow() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        authService.logout("unknown");

        verify(refreshTokenRepository, never()).delete(any());
    }
}

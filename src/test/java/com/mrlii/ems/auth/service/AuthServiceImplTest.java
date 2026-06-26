package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.helper.AuthPersistenceHelper;
import com.mrlii.ems.auth.helper.AuthServiceHelper;
import com.mrlii.ems.auth.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuthServiceHelper authServiceHelper;
    @Mock private AuthPersistenceHelper authPersistenceHelper;

    @InjectMocks private AuthServiceImpl authService;

    private static final String EMAIL = "user@example.com";
    private static final String RAW_PASSWORD = "secret";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final Instant EXPIRY = Instant.parse("2030-01-01T01:00:00Z");

    private UserAccount userAccount;
    private RefreshToken refreshToken;

    @BeforeEach
    void setUp() {
        userAccount = UserAccount.builder()
                .id(1L)
                .userId(USER_ID)
                .email(EMAIL)
                .enabled(true)
                .build();
        refreshToken = RefreshToken.builder()
                .token("refresh-token")
                .userAccount(userAccount)
                .expiryDate(EXPIRY)
                .build();
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_validCredentials_returnsTokenPair() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userAccount);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(authServiceHelper.generateAccessToken(eq(userAccount), anyList(), any())).thenReturn("access-token");
        when(authServiceHelper.accessTokenExpiresAt(any())).thenReturn(EXPIRY);
        when(authPersistenceHelper.rotateRefreshToken(userAccount)).thenReturn(refreshToken);

        AuthTokenPair pair = authService.login(new LoginRequest(EMAIL, RAW_PASSWORD));

        assertThat(pair.accessToken()).isEqualTo("access-token");
        assertThat(pair.accessTokenExpiresAt()).isEqualTo(EXPIRY);
        assertThat(pair.refreshToken()).isEqualTo("refresh-token");
        assertThat(pair.refreshTokenExpiresAt()).isEqualTo(EXPIRY);
        verify(authPersistenceHelper).rotateRefreshToken(userAccount);
    }

    // ── refreshToken ──────────────────────────────────────────────────────────

    @Test
    void refreshToken_validToken_returnsNewPairWithRotatedRefreshToken() {
        RefreshToken rotated = RefreshToken.builder()
                .token("new-refresh-token")
                .userAccount(userAccount)
                .expiryDate(EXPIRY)
                .build();

        when(authPersistenceHelper.findValidRefreshToken("old-token")).thenReturn(refreshToken);
        when(authPersistenceHelper.rotateRefreshToken(userAccount)).thenReturn(rotated);
        when(authServiceHelper.generateAccessToken(eq(userAccount), anyList(), any())).thenReturn("new-access-token");
        when(authServiceHelper.accessTokenExpiresAt(any())).thenReturn(EXPIRY);

        AuthTokenPair pair = authService.refreshToken("old-token");

        assertThat(pair.accessToken()).isEqualTo("new-access-token");
        assertThat(pair.refreshToken()).isEqualTo("new-refresh-token");
        verify(authPersistenceHelper).findValidRefreshToken("old-token");
        verify(authPersistenceHelper).rotateRefreshToken(userAccount);
    }

    // ── logout ────────────────────────────────────────────────────────────────

    @Test
    void logout_delegatesToPersistenceHelper() {
        authService.logout("valid-token");

        verify(authPersistenceHelper).deleteRefreshToken("valid-token");
    }
}

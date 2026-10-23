package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.common.config.RsaKeyProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceHelperTest {

    @Mock private JwtEncoder jwtEncoder;
    @Mock private RsaKeyProperties rsaKeyProperties;

    @InjectMocks private AuthServiceHelper authServiceHelper;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final long EXPIRATION_MS = 3600000L;

    // ── generateAccessToken ───────────────────────────────────────────────────

    @Test
    void generateAccessToken_validAccount_returnsTokenValue() {
        UserAccount account = UserAccount.builder()
                .id(1L)
                .userId(USER_ID)
                .email("user@example.com")
                .enabled(true)
                .build();
        Jwt jwt = Jwt.withTokenValue("generated-token")
                .header("alg", "RS256")
                .subject(USER_ID.toString())
                .build();

        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

        String token = authServiceHelper.generateAccessToken(account, List.of("MANAGE_EMPLOYEES"), Instant.parse("2026-01-01T00:00:00Z"));

        assertThat(token).isEqualTo("generated-token");
    }

    @Test
    void generateAccessToken_nullUserId_throwsIllegalState() {
        UserAccount account = UserAccount.builder()
                .userId(null)
                .email("user@example.com")
                .enabled(true)
                .build();
        var now = Instant.parse("2026-01-01T00:00:00Z");
        var permissions = List.of("MANAGE_EMPLOYEES");

        assertThatThrownBy(() -> authServiceHelper.generateAccessToken(account, permissions, now))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("UserAccount has no userId");
    }

    // ── accessTokenExpiresAt ──────────────────────────────────────────────────

    @Test
    void accessTokenExpiresAt_returnsNowPlusExpirationMs() {
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        Instant now = Instant.parse("2026-01-01T00:00:00Z");

        Instant expiry = authServiceHelper.accessTokenExpiresAt(now);

        assertThat(expiry).isEqualTo(now.plusMillis(EXPIRATION_MS));
    }
}

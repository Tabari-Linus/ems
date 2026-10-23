package com.mrlii.ems.auth.helper;

import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.common.config.RsaKeyProperties;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceHelperTest {

    private static final UUID PUBLIC_ID = UUID.randomUUID();
    private static final UUID FAMILY = UUID.randomUUID();
    private static final long EXPIRATION_MS = 900_000L;
    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock private JwtEncoder jwtEncoder;
    @Mock private RsaKeyProperties rsaKeyProperties;

    private AuthServiceHelper helper(boolean legacyClaim) {
        return new AuthServiceHelper(jwtEncoder, rsaKeyProperties, AuthTestData.authProperties(legacyClaim));
    }

    private static UserAccount account() {
        return UserAccount.builder()
                .id(1L)
                .publicId(PUBLIC_ID)
                .email("user@example.com")
                .employee(AuthTestData.employee(CommonStatus.ACTIVE, AuthTestData.accessLevel(
                        CommonStatus.ACTIVE, Permission.VIEW_SELF, Permission.VIEW_COMPANY)))
                .build();
    }

    private void stubEncoder() {
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(
                Jwt.withTokenValue("generated-token").header("alg", "RS256").subject(PUBLIC_ID.toString()).build());
    }

    private JwtClaimsSet capturedClaims() {
        ArgumentCaptor<JwtEncoderParameters> captor = ArgumentCaptor.forClass(JwtEncoderParameters.class);
        verify(jwtEncoder).encode(captor.capture());
        return captor.getValue().getClaims();
    }

    @Test
    void generateAccessToken_writesStandardClaims() {
        stubEncoder();

        String token = helper(false).generateAccessToken(account(), FAMILY, NOW);

        assertThat(token).isEqualTo("generated-token");
        JwtClaimsSet claims = capturedClaims();
        assertThat(claims.getSubject()).isEqualTo(PUBLIC_ID.toString());
        assertThat(claims.getClaimAsString("iss")).isEqualTo(AuthTestData.ISSUER);
        assertThat(claims.getAudience()).containsExactly(AuthTestData.AUDIENCE);
        assertThat(claims.getIssuedAt()).isEqualTo(NOW);
        assertThat(claims.getExpiresAt()).isEqualTo(NOW.plusMillis(EXPIRATION_MS));
        assertThat(claims.getId()).isNotBlank();
        assertThat(claims.getClaimAsString("sid")).isEqualTo(FAMILY.toString());
        assertThat(claims.getClaims()).doesNotContainKeys("permissions", "account_id");
    }

    @Test
    void generateAccessToken_withLegacyFlag_addsPermissionsAndAccountId() {
        stubEncoder();

        helper(true).generateAccessToken(account(), FAMILY, NOW);

        JwtClaimsSet claims = capturedClaims();
        List<String> permissions = claims.getClaim("permissions");
        assertThat(permissions).containsExactly("VIEW_COMPANY", "VIEW_SELF");
        assertThat((Long) claims.getClaim("account_id")).isEqualTo(1L);
    }

    @Test
    void generateAccessToken_withoutSessionFamily_omitsSid() {
        stubEncoder();

        helper(false).generateAccessToken(account(), null, NOW);

        assertThat(capturedClaims().getClaims()).doesNotContainKey("sid");
    }

    @Test
    void generateAccessToken_nullPublicId_throwsIllegalState() {
        AuthServiceHelper helper = helper(false);
        UserAccount account = UserAccount.builder().email("user@example.com").build();

        assertThatThrownBy(() -> helper.generateAccessToken(account, FAMILY, NOW))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no publicId");
    }

    @Test
    void expiryHelpers_addConfiguredLifetimes() {
        AuthServiceHelper helper = helper(false);
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);
        when(rsaKeyProperties.refreshExpirationMs()).thenReturn(1000L);

        assertThat(helper.accessTokenExpiresAt(NOW)).isEqualTo(NOW.plusMillis(EXPIRATION_MS));
        assertThat(helper.refreshTokenExpiresAt(NOW)).isEqualTo(NOW.plusMillis(1000L));
    }
}

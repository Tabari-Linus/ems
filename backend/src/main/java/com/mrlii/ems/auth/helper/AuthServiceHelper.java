package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.security.AccountAuthenticationToken;
import com.mrlii.ems.auth.security.AuthenticatedAccount;
import com.mrlii.ems.common.config.AuthProperties;
import com.mrlii.ems.common.config.RsaKeyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Issues access tokens. Claims: {@code sub} (account public id), {@code iss}, {@code aud}, {@code iat},
 * {@code exp}, {@code jti} and {@code sid} (session family). While {@code app.auth.legacy-permissions-claim}
 * is on, {@code permissions} and {@code account_id} are added for the current frontend; the server never
 * reads them.
 */
@Component
@RequiredArgsConstructor
public class AuthServiceHelper {

    static final String LEGACY_PERMISSIONS_CLAIM = "permissions";
    static final String LEGACY_ACCOUNT_ID_CLAIM = "account_id";

    private final JwtEncoder jwtEncoder;
    private final RsaKeyProperties rsaKeyProperties;
    private final AuthProperties authProperties;

    public String generateAccessToken(UserAccount account, UUID sessionFamilyId, Instant now) {
        UUID publicId = account.getPublicId();
        if (publicId == null) {
            throw new IllegalStateException("Cannot generate token: UserAccount has no publicId");
        }
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(authProperties.jwt().issuer())
                .audience(List.of(authProperties.jwt().audience()))
                .subject(publicId.toString())
                .issuedAt(now)
                .expiresAt(accessTokenExpiresAt(now))
                .id(UUID.randomUUID().toString());
        if (sessionFamilyId != null) {
            claims.claim(AccountAuthenticationToken.SESSION_CLAIM, sessionFamilyId.toString());
        }
        if (authProperties.legacyPermissionsClaim()) {
            List<String> permissions = AuthenticatedAccount.of(account).sortedPermissions().stream()
                    .map(Enum::name)
                    .toList();
            claims.claim(LEGACY_PERMISSIONS_CLAIM, permissions);
            claims.claim(LEGACY_ACCOUNT_ID_CLAIM, account.getId());
        }
        return jwtEncoder.encode(JwtEncoderParameters.from(claims.build())).getTokenValue();
    }

    public Instant accessTokenExpiresAt(Instant now) {
        return now.plusMillis(rsaKeyProperties.expirationMs());
    }

    public Instant refreshTokenExpiresAt(Instant now) {
        return now.plusMillis(rsaKeyProperties.refreshExpirationMs());
    }
}

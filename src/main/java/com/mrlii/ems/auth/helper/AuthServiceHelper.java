package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.common.config.RsaKeyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuthServiceHelper {

    private final JwtEncoder jwtEncoder;
    private final RsaKeyProperties rsaKeyProperties;

    public String generateAccessToken(UserAccount account, List<String> permissions, Instant now) {
        UUID userId = account.getUserId();
        if (userId == null) {
            throw new IllegalStateException("Cannot generate token: UserAccount has no userId");
        }
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ems-app")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusMillis(rsaKeyProperties.expirationMs()))
                .claim("permissions", permissions)
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public Instant accessTokenExpiresAt(Instant now) {
        return now.plusMillis(rsaKeyProperties.expirationMs());
    }
}

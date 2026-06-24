package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.config.RsaKeyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final RsaKeyProperties rsaKeyProperties;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount account = userAccountRepository.findByEmailWithPermissions(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!account.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        List<String> permissions = resolvePermissions(account);
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(rsaKeyProperties.expirationMs());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ems-app")
                .subject(account.getUserId().toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("permissions", permissions)
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new AuthResponse(token, expiresAt);
    }

    private List<String> resolvePermissions(UserAccount account) {
        if (account.getEmployee() == null || account.getEmployee().getAccessLevel() == null) {
            return List.of();
        }
        return account.getEmployee().getAccessLevel().getPermissions().stream()
                .map(ps -> ps.getPermissionName().name())
                .toList();
    }
}

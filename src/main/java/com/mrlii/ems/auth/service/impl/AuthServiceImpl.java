package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.RefreshTokenRepository;
import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.config.RsaKeyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final RsaKeyProperties rsaKeyProperties;

    @Override
    @Transactional
    public AuthTokenPair login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        UserAccount account = (UserAccount) authentication.getPrincipal();

        List<String> permissions = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        Instant now = Instant.now();
        String accessToken = generateAccessToken(account, permissions, now);
        RefreshToken refreshToken = rotateRefreshToken(account);

        return new AuthTokenPair(
                accessToken,
                now.plusMillis(rsaKeyProperties.expirationMs()),
                refreshToken.getToken(),
                refreshToken.getExpiryDate()
        );
    }

    @Override
    @Transactional
    public AuthTokenPair refreshToken(String token) {
        RefreshToken existing = refreshTokenRepository.findByToken(token)
                .map(this::verifyExpiration)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        UserAccount account = existing.getUserAccount();
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        RefreshToken rotated = rotateRefreshToken(account);

        Instant now = Instant.now();
        List<String> permissions = account.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new AuthTokenPair(
                generateAccessToken(account, permissions, now),
                now.plusMillis(rsaKeyProperties.expirationMs()),
                rotated.getToken(),
                rotated.getExpiryDate()
        );
    }

    @Override
    @Transactional
    public void logout(String token) {
        refreshTokenRepository.findByToken(token)
                .ifPresent(refreshTokenRepository::delete);
    }

    private String generateAccessToken(UserAccount account, List<String> permissions, Instant now) {
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

    private RefreshToken rotateRefreshToken(UserAccount userAccount) {
        refreshTokenRepository.deleteByUserAccount(userAccount);
        RefreshToken token = RefreshToken.builder()
                .userAccount(userAccount)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(rsaKeyProperties.refreshExpirationMs()))
                .build();
        return refreshTokenRepository.save(token);
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired. Please sign in again");
        }
        return token;
    }
}

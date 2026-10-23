package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.RefreshTokenRepository;
import com.mrlii.ems.common.config.RsaKeyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuthPersistenceHelper {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RsaKeyProperties rsaKeyProperties;

    public RefreshToken rotateRefreshToken(UserAccount userAccount) {
        refreshTokenRepository.deleteByUserAccount(userAccount);
        RefreshToken token = RefreshToken.builder()
                .userAccount(userAccount)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(rsaKeyProperties.refreshExpirationMs()))
                .build();
        return refreshTokenRepository.save(token);
    }

    public RefreshToken findValidRefreshToken(String token) {
        RefreshToken existing = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (existing.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(existing);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired. Please sign in again");
        }

        if (existing.getUserAccount() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        return existing;
    }

    public void deleteRefreshToken(String token) {
        refreshTokenRepository.findByToken(token)
                .ifPresent(refreshTokenRepository::delete);
    }
}

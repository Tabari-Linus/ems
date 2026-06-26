package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.helper.AuthPersistenceHelper;
import com.mrlii.ems.auth.helper.AuthServiceHelper;
import com.mrlii.ems.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuthServiceHelper authServiceHelper;
    private final AuthPersistenceHelper authPersistenceHelper;

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
        RefreshToken refreshToken = authPersistenceHelper.rotateRefreshToken(account);

        return new AuthTokenPair(
                authServiceHelper.generateAccessToken(account, permissions, now),
                authServiceHelper.accessTokenExpiresAt(now),
                refreshToken.getToken(),
                refreshToken.getExpiryDate()
        );
    }

    @Override
    @Transactional
    public AuthTokenPair refreshToken(String token) {
        RefreshToken existing = authPersistenceHelper.findValidRefreshToken(token);
        UserAccount account = existing.getUserAccount();

        Instant now = Instant.now();
        List<String> permissions = account.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        RefreshToken rotated = authPersistenceHelper.rotateRefreshToken(account);

        return new AuthTokenPair(
                authServiceHelper.generateAccessToken(account, permissions, now),
                authServiceHelper.accessTokenExpiresAt(now),
                rotated.getToken(),
                rotated.getExpiryDate()
        );
    }

    @Override
    @Transactional
    public void logout(String token) {
        authPersistenceHelper.deleteRefreshToken(token);
    }
}

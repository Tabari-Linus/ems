package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.auth.dto.WelcomeLink;
import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.repository.OneTimeTokenRepository;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.OneTimeTokenService;
import com.mrlii.ems.auth.util.TokenHasher;
import com.mrlii.ems.common.config.AuthProperties;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
public class OneTimeTokenServiceImpl implements OneTimeTokenService {

    static final String SET_PASSWORD_PATH = "/set-password";

    private final OneTimeTokenRepository oneTimeTokenRepository;
    private final UserAccountRepository userAccountRepository;
    private final TokenHasher tokenHasher;
    private final AuthProperties authProperties;
    private final String frontendUrl;

    public OneTimeTokenServiceImpl(OneTimeTokenRepository oneTimeTokenRepository,
                                   UserAccountRepository userAccountRepository,
                                   TokenHasher tokenHasher,
                                   AuthProperties authProperties,
                                   @Value("${app.frontend-url}") String frontendUrl) {
        this.oneTimeTokenRepository = oneTimeTokenRepository;
        this.userAccountRepository = userAccountRepository;
        this.tokenHasher = tokenHasher;
        this.authProperties = authProperties;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Transactional
    public String issue(UserAccount account, OneTimeTokenPurpose purpose) {
        int invalidated = oneTimeTokenRepository.deleteUnused(account.getId(), purpose);
        Instant now = Instant.now();
        String rawToken = tokenHasher.generate();
        oneTimeTokenRepository.save(OneTimeToken.builder()
                .userAccount(account)
                .purpose(purpose)
                .tokenHash(tokenHasher.hash(rawToken))
                .createdAt(now)
                .expiresAt(now.plus(ttl(purpose)))
                .build());
        log.info("Issued {} token for account id={} (invalidated {} older)", purpose, account.getId(), invalidated);
        return rawToken;
    }

    @Override
    @Transactional
    public WelcomeLink issueWelcomeLink(Long userAccountId) {
        UserAccount account = userAccountRepository.findById(userAccountId)
                .orElseThrow(() -> new EntityNotFoundException("User account %d not found".formatted(userAccountId)));
        String rawToken = issue(account, OneTimeTokenPurpose.WELCOME);
        Duration ttl = ttl(OneTimeTokenPurpose.WELCOME);
        String url = UriComponentsBuilder.fromUriString(frontendUrl)
                .path(SET_PASSWORD_PATH)
                .queryParam("token", rawToken)
                .build()
                .toUriString();
        return new WelcomeLink(url, Instant.now().plus(ttl), ttl.toHours());
    }

    @Override
    @Transactional(noRollbackFor = AuthException.class)
    public OneTimeToken findRedeemable(String rawToken, Instant now) {
        OneTimeToken token = (rawToken == null || rawToken.isBlank())
                ? null
                : oneTimeTokenRepository.findByTokenHash(tokenHasher.hash(rawToken)).orElse(null);
        if (token == null || token.isUsed()) {
            throw new AuthException(AuthErrorCode.TOKEN_INVALID, HttpStatus.BAD_REQUEST,
                    "This link is invalid or has already been used. Ask your administrator for a new one.");
        }
        if (token.isExpiredAt(now)) {
            throw new AuthException(AuthErrorCode.TOKEN_EXPIRED, HttpStatus.BAD_REQUEST,
                    "This link has expired. Ask your administrator for a new one.");
        }
        return token;
    }

    @Override
    @Transactional
    public void markUsed(OneTimeToken token, Instant now) {
        token.setUsedAt(now);
        oneTimeTokenRepository.save(token);
    }

    private Duration ttl(OneTimeTokenPurpose purpose) {
        return switch (purpose) {
            case WELCOME -> authProperties.tokens().welcomeTtl();
            case PASSWORD_RESET -> authProperties.tokens().passwordResetTtl();
        };
    }
}

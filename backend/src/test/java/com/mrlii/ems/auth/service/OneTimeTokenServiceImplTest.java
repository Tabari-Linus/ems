package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.WelcomeLink;
import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.repository.OneTimeTokenRepository;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.impl.OneTimeTokenServiceImpl;
import com.mrlii.ems.auth.util.TokenHasher;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OneTimeTokenServiceImplTest {

    @Mock private OneTimeTokenRepository tokenRepository;
    @Mock private UserAccountRepository userAccountRepository;

    private final TokenHasher tokenHasher = new TokenHasher();
    private OneTimeTokenServiceImpl service;
    private UserAccount account;

    @BeforeEach
    void setUp() {
        service = new OneTimeTokenServiceImpl(tokenRepository, userAccountRepository, tokenHasher,
                AuthTestData.authProperties(), "https://app.example.com");
        account = AuthTestData.activeAccount();
    }

    @Test
    void issue_invalidatesOlderAndStoresOnlyHashWithPurposeTtl() {
        String raw = service.issue(account, OneTimeTokenPurpose.WELCOME);

        verify(tokenRepository).deleteUnused(1L, OneTimeTokenPurpose.WELCOME);
        ArgumentCaptor<OneTimeToken> captor = ArgumentCaptor.forClass(OneTimeToken.class);
        verify(tokenRepository).save(captor.capture());
        OneTimeToken stored = captor.getValue();
        assertThat(stored.getTokenHash()).isEqualTo(tokenHasher.hash(raw)).isNotEqualTo(raw);
        assertThat(stored.getPurpose()).isEqualTo(OneTimeTokenPurpose.WELCOME);
        assertThat(Duration.between(stored.getCreatedAt(), stored.getExpiresAt())).isEqualTo(Duration.ofHours(72));
    }

    @Test
    void issue_passwordReset_usesItsOwnTtl() {
        service.issue(account, OneTimeTokenPurpose.PASSWORD_RESET);

        ArgumentCaptor<OneTimeToken> captor = ArgumentCaptor.forClass(OneTimeToken.class);
        verify(tokenRepository).save(captor.capture());
        assertThat(Duration.between(captor.getValue().getCreatedAt(), captor.getValue().getExpiresAt()))
                .isEqualTo(Duration.ofHours(1));
    }

    @Test
    void issueWelcomeLink_buildsFrontendSetPasswordUrl() {
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));

        WelcomeLink link = service.issueWelcomeLink(1L);

        assertThat(link.url()).startsWith("https://app.example.com/set-password?token=");
        assertThat(link.validForHours()).isEqualTo(72);
        assertThat(link.expiresAt()).isCloseTo(Instant.now().plus(Duration.ofHours(72)), within(Duration.ofSeconds(5)));
        assertThat(link.toString()).doesNotContain("token=");
    }

    @Test
    void issueWelcomeLink_unknownAccount_throws() {
        when(userAccountRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.issueWelcomeLink(9L)).isInstanceOf(EntityNotFoundException.class);
    }

    private OneTimeToken stored(Instant expiresAt, Instant usedAt) {
        return OneTimeToken.builder().id(3L).userAccount(account).purpose(OneTimeTokenPurpose.WELCOME)
                .tokenHash(tokenHasher.hash("raw")).expiresAt(expiresAt).usedAt(usedAt).build();
    }

    @Test
    void findRedeemable_validToken_isReturned() {
        Instant now = Instant.now();
        OneTimeToken token = stored(now.plusSeconds(60), null);
        when(tokenRepository.findByTokenHash(tokenHasher.hash("raw"))).thenReturn(Optional.of(token));

        assertThat(service.findRedeemable("raw", now)).isSameAs(token);
    }

    @Test
    void findRedeemable_unknownOrUsed_isTokenInvalid400() {
        Instant now = Instant.now();
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findRedeemable("raw", now))
                .isInstanceOfSatisfying(AuthException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(AuthErrorCode.TOKEN_INVALID);
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });
        assertThatThrownBy(() -> service.findRedeemable(" ", now)).isInstanceOf(AuthException.class);
    }

    @Test
    void findRedeemable_usedToken_isTokenInvalid() {
        Instant now = Instant.now();
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored(now.plusSeconds(60), now)));

        assertThatThrownBy(() -> service.findRedeemable("raw", now))
                .extracting("code").isEqualTo(AuthErrorCode.TOKEN_INVALID);
    }

    @Test
    void findRedeemable_expiredToken_isTokenExpired() {
        Instant now = Instant.now();
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored(now, null)));

        assertThatThrownBy(() -> service.findRedeemable("raw", now))
                .extracting("code").isEqualTo(AuthErrorCode.TOKEN_EXPIRED);
    }

    @Test
    void markUsed_stampsUsedAt() {
        Instant now = Instant.now();
        OneTimeToken token = stored(now.plusSeconds(60), null);

        service.markUsed(token, now);

        assertThat(token.isUsed()).isTrue();
        verify(tokenRepository).save(token);
    }
}

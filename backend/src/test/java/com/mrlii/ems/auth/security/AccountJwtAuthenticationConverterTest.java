package com.mrlii.ems.auth.security;

import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.helper.AuthPrincipalLoader;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.util.AccountStatusValidator;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountJwtAuthenticationConverterTest {

    @Mock private UserAccountRepository userAccountRepository;

    private PrincipalCache cache;
    private AccountJwtAuthenticationConverter converter;
    private UserAccount account;

    @BeforeEach
    void setUp() {
        cache = new PrincipalCache(AuthTestData.authProperties());
        AuthPrincipalLoader loader = new AuthPrincipalLoader(userAccountRepository, new AccountStatusValidator());
        converter = new AccountJwtAuthenticationConverter(cache, loader);
        account = AuthTestData.activeAccount();
    }

    private Jwt jwt(String subject) {
        Jwt.Builder builder = Jwt.withTokenValue("t").header("alg", "RS256").claim("sid", UUID.randomUUID().toString());
        if (subject != null) {
            builder.subject(subject);
        }
        // the legacy claim must be ignored for authorization
        builder.claim("permissions", java.util.List.of("MANAGE_ACCESS_LEVEL"));
        return builder.build();
    }

    private AuthErrorCode rejectionCode(Jwt jwt) {
        try {
            converter.convert(jwt);
            return null;
        } catch (AccountAccessDeniedException e) {
            return e.getCode();
        }
    }

    @Test
    void activeAccount_getsAuthoritiesFromDatabaseNotClaims() {
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));

        AbstractAuthenticationToken token = converter.convert(jwt(account.getPublicId().toString()));

        assertThat(token).isInstanceOf(AccountAuthenticationToken.class);
        assertThat(token.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("VIEW_SELF");
        AccountAuthenticationToken accountToken = (AccountAuthenticationToken) token;
        assertThat(accountToken.getAccount().accountId()).isEqualTo(1L);
        assertThat(accountToken.sessionFamilyId()).isNotNull();
        assertThat(token.getName()).isEqualTo(account.getPublicId().toString());
    }

    @Test
    void principalIsCached_untilEvicted() {
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));
        Jwt jwt = jwt(account.getPublicId().toString());

        converter.convert(jwt);
        converter.convert(jwt);
        cache.evictEmployee(5L);
        converter.convert(jwt);

        verify(userAccountRepository, times(2)).findByPublicIdWithAccess(account.getPublicId());
    }

    @Test
    void inactiveEmployee_isRejected() {
        account.getEmployee().setStatus(CommonStatus.INACTIVE);
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));

        assertThat(rejectionCode(jwt(account.getPublicId().toString()))).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
    }

    @Test
    void archivedOrDeletedEmployee_isRejected() {
        account.getEmployee().setDeletedAt(LocalDateTime.now());
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));

        assertThat(rejectionCode(jwt(account.getPublicId().toString()))).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);
    }

    @Test
    void disabledOrLockedAccount_isRejected() {
        account.setEnabled(false);
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));
        assertThat(rejectionCode(jwt(account.getPublicId().toString()))).isEqualTo(AuthErrorCode.ACCOUNT_INACTIVE);

        account.setEnabled(true);
        account.setLockedUntil(java.time.Instant.now().plusSeconds(600));
        assertThat(rejectionCode(jwt(account.getPublicId().toString()))).isEqualTo(AuthErrorCode.ACCOUNT_LOCKED);
    }

    @Test
    void archivedAccessLevel_grantsNothing() {
        account.getEmployee().setAccessLevel(AuthTestData.accessLevel(CommonStatus.ARCHIVED, Permission.VIEW_COMPANY));
        when(userAccountRepository.findByPublicIdWithAccess(account.getPublicId())).thenReturn(Optional.of(account));

        assertThat(converter.convert(jwt(account.getPublicId().toString())).getAuthorities()).isEmpty();
    }

    @Test
    void unknownAccount_isTokenInvalid() {
        UUID unknown = UUID.randomUUID();
        when(userAccountRepository.findByPublicIdWithAccess(unknown)).thenReturn(Optional.empty());

        assertThat(rejectionCode(jwt(unknown.toString()))).isEqualTo(AuthErrorCode.TOKEN_INVALID);
    }

    @Test
    void missingOrMalformedSubject_isTokenInvalid() {
        assertThat(rejectionCode(jwt(null))).isEqualTo(AuthErrorCode.TOKEN_INVALID);
        assertThat(rejectionCode(jwt("not-a-uuid"))).isEqualTo(AuthErrorCode.TOKEN_INVALID);
    }

    @Test
    void sessionFamilyId_missingOrMalformed_isNull() {
        AuthenticatedAccount principal = AuthenticatedAccount.of(account);
        Jwt noSid = Jwt.withTokenValue("t").header("alg", "RS256").subject("s").build();
        Jwt badSid = Jwt.withTokenValue("t").header("alg", "RS256").subject("s").claim("sid", "x").build();

        assertThat(new AccountAuthenticationToken(noSid, principal).sessionFamilyId()).isNull();
        assertThat(new AccountAuthenticationToken(badSid, principal).sessionFamilyId()).isNull();
    }

    @Test
    void tokensWithSameJwtAndAccount_areEqual() {
        AuthenticatedAccount principal = AuthenticatedAccount.of(account);
        Jwt jwt = jwt(account.getPublicId().toString());
        AccountAuthenticationToken a = new AccountAuthenticationToken(jwt, principal);
        AccountAuthenticationToken b = new AccountAuthenticationToken(jwt, principal);

        assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
        assertThat(a).isNotEqualTo(new Object());
    }
}

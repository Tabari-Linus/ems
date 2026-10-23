package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.helper.AuthPrincipalLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Turns a validated access token into an {@link AccountAuthenticationToken}. The account is loaded by
 * {@code sub} (cached briefly in {@link PrincipalCache}); a disabled or locked account, or an employee
 * who is INACTIVE/ARCHIVED/deleted, is rejected with 401. Authorities are the permissions of the
 * employee's ACTIVE access level; token claims are never used for authorization.
 */
@Component
@RequiredArgsConstructor
public class AccountJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final PrincipalCache principalCache;
    private final AuthPrincipalLoader principalLoader;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID publicId = parseSubject(jwt.getSubject());
        try {
            AuthenticatedAccount account = principalCache.get(publicId, principalLoader::load);
            return new AccountAuthenticationToken(jwt, account);
        } catch (AuthException e) {
            throw new AccountAccessDeniedException(e.getCode(), e.getMessage());
        }
    }

    private static UUID parseSubject(String subject) {
        if (subject == null) {
            throw new AccountAccessDeniedException(AuthErrorCode.TOKEN_INVALID, "The access token has no subject");
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            throw new AccountAccessDeniedException(AuthErrorCode.TOKEN_INVALID, "The access token subject is malformed");
        }
    }
}

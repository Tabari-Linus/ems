package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import lombok.Getter;
import org.springframework.security.core.AuthenticationException;

/**
 * Raised while authenticating a bearer token whose account may no longer be used (disabled, locked,
 * employee inactive/archived, account gone). Always answered with 401 and the given {@code code}.
 */
@Getter
public class AccountAccessDeniedException extends AuthenticationException {

    private final AuthErrorCode code;

    public AccountAccessDeniedException(AuthErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}

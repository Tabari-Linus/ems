package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Access to the authenticated caller of the current request. */
@Component
public class CurrentAccountProvider {

    public AccountAuthenticationToken requireAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AccountAuthenticationToken token && token.isAuthenticated()) {
            return token;
        }
        throw new AuthException(AuthErrorCode.UNAUTHENTICATED, "Authentication is required");
    }

    public AuthenticatedAccount requireAccount() {
        return requireAuthentication().getAccount();
    }
}

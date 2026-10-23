package com.mrlii.ems.common.security;

import com.mrlii.ems.auth.security.AccountAuthenticationToken;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** {@code created_by}/{@code last_modified_by}: the caller's account id, resolved server-side (not from token claims). */
@Component
public class SecurityAuditorAware implements AuditorAware<Long> {

    @Override
    public Optional<Long> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof AccountAuthenticationToken token && token.isAuthenticated()) {
            return Optional.ofNullable(token.getAccount().accountId());
        }
        return Optional.empty();
    }
}

package com.mrlii.ems.common.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityAuditorAware implements AuditorAware<Long> {

    @Override
    public Optional<Long> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Object accountId = jwtAuth.getToken().getClaim("account_id");
            if (accountId instanceof Long id) {
                return Optional.of(id);
            }
            if (accountId instanceof Integer id) {
                return Optional.of(id.longValue());
            }
            if (accountId instanceof Number id) {
                return Optional.of(id.longValue());
            }
        }
        return Optional.empty();
    }
}

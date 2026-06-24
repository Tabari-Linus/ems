package com.mrlii.ems.common.security;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SecurityAuditorAware implements AuditorAware<Long> {

    private final UserAccountRepository userAccountRepository;

    @Override
    public Optional<Long> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            UUID userId = UUID.fromString(jwtAuth.getToken().getSubject());
            return userAccountRepository.findByUserId(userId).map(UserAccount::getId);
        }
        return Optional.empty();
    }
}

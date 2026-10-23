package com.mrlii.ems.auth.helper;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.security.AuthenticatedAccount;
import com.mrlii.ems.auth.util.AccountStatusValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/** Loads an account by public id, applies the status gates and builds its principal. */
@Component
@RequiredArgsConstructor
public class AuthPrincipalLoader {

    private final UserAccountRepository userAccountRepository;
    private final AccountStatusValidator accountStatusValidator;

    @Transactional(readOnly = true)
    public AuthenticatedAccount load(UUID publicId) {
        UserAccount account = userAccountRepository.findByPublicIdWithAccess(publicId)
                .orElseThrow(() -> new AuthException(AuthErrorCode.TOKEN_INVALID, "The account no longer exists"));
        accountStatusValidator.assertUsable(account, Instant.now());
        return AuthenticatedAccount.of(account);
    }
}

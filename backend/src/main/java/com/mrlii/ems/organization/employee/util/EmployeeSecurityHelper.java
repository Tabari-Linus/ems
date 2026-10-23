package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmployeeSecurityHelper {

    private final UserAccountRepository userAccountRepository;

    public Long getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            throw new BusinessRuleViolationException("No authenticated user in security context");
        }
        UUID userId = UUID.fromString(jwtAuth.getToken().getSubject());
        return userAccountRepository.findByUserId(userId)
                .map(account -> {
                    var employee = account.getEmployee();
                    if (employee == null) {
                        throw new BusinessRuleViolationException("Authenticated user has no linked employee record");
                    }
                    return employee.getId();
                })
                .orElseThrow(() -> new BusinessRuleViolationException("User account not found"));
    }
}

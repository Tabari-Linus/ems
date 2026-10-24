package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.auth.security.AccountAuthenticationToken;
import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class EmployeeSecurityHelper {

    /** The employee id of the caller, resolved server-side from the access token subject. */
    public Long getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof AccountAuthenticationToken token)) {
            throw new BusinessRuleViolationException("No authenticated user in security context");
        }
        Long employeeId = token.getAccount().employeeId();
        if (employeeId == null) {
            throw new BusinessRuleViolationException("Authenticated user has no linked employee record");
        }
        return employeeId;
    }
}

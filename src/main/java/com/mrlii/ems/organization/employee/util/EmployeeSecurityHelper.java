package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import org.springframework.stereotype.Component;

@Component
public class EmployeeSecurityHelper {

    /**
     * Resolves the authenticated employee's ID from the security context.
     * Do: When Spring Security + OAuth2/JWT is wired, parse employeeId from JWT claims:
     *   Authentication auth = SecurityContextHolder.getContext().getAuthentication();
     *   ((JwtAuthenticationToken) auth).getTokenAttributes().get("employeeId")
     */
    public Long getCurrentEmployeeId() {
        throw new BusinessRuleViolationException(
                "Security context not yet wired — implement when OAuth2/JWT is configured");
    }
}

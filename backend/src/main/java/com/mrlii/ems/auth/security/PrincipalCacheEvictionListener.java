package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.event.AccessLevelChangedEvent;
import com.mrlii.ems.common.event.EmployeeAccessChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Keeps {@link PrincipalCache} honest. Runs after the change commits (so a concurrent request cannot
 * re-cache the old state), or immediately when published outside a transaction.
 * <ul>
 *   <li>Access-level change (permissions, status, membership): evict everything; one level can affect
 *       many accounts and membership changes move employees between levels.</li>
 *   <li>Employee status / assignment change: evict that employee; INACTIVE or ARCHIVED also revokes
 *       all of the employee's refresh sessions.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PrincipalCacheEvictionListener {

    private final PrincipalCache principalCache;
    private final AuthService authService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAccessLevelChanged(AccessLevelChangedEvent event) {
        principalCache.evictAll();
        log.debug("Principal cache cleared after access level {} changed", event.accessLevelId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEmployeeAccessChanged(EmployeeAccessChangedEvent event) {
        principalCache.evictEmployee(event.employeeId());
        if (event.revokesAccess()) {
            int revoked = authService.revokeSessionsOfEmployee(event.employeeId());
            log.info("Employee {} is {}: revoked {} session(s)", event.employeeId(), event.status(), revoked);
        }
    }
}

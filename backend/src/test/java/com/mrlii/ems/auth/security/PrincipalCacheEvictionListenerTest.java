package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.service.AuthService;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.event.AccessLevelChangedEvent;
import com.mrlii.ems.common.event.EmployeeAccessChangedEvent;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PrincipalCacheEvictionListenerTest {

    @Mock private AuthService authService;

    private PrincipalCache cache;
    private PrincipalCacheEvictionListener listener;
    private final UUID first = UUID.randomUUID();
    private final UUID second = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        cache = new PrincipalCache(AuthTestData.authProperties());
        listener = new PrincipalCacheEvictionListener(cache, authService);
        cache.get(first, id -> new AuthenticatedAccount(1L, id, "a@x.y", 10L, 3L, Set.of()));
        cache.get(second, id -> new AuthenticatedAccount(2L, id, "b@x.y", 20L, 3L, Set.of()));
    }

    @Test
    void accessLevelChange_evictsEverything() {
        listener.onAccessLevelChanged(new AccessLevelChangedEvent(3L));

        assertThat(cache.getIfPresent(first)).isNull();
        assertThat(cache.getIfPresent(second)).isNull();
    }

    @Test
    void employeeChange_evictsOnlyThatEmployee_andKeepsSessionsWhenStillActive() {
        listener.onEmployeeAccessChanged(new EmployeeAccessChangedEvent(10L, CommonStatus.ACTIVE));

        assertThat(cache.getIfPresent(first)).isNull();
        assertThat(cache.getIfPresent(second)).isNotNull();
        verify(authService, never()).revokeSessionsOfEmployee(anyLong());
    }

    @Test
    void employeeDeactivatedOrArchived_revokesSessions() {
        listener.onEmployeeAccessChanged(new EmployeeAccessChangedEvent(10L, CommonStatus.INACTIVE));
        listener.onEmployeeAccessChanged(new EmployeeAccessChangedEvent(20L, CommonStatus.ARCHIVED));

        verify(authService).revokeSessionsOfEmployee(10L);
        verify(authService).revokeSessionsOfEmployee(20L);
    }

    @Test
    void evictAccount_removesMatchingEntry() {
        cache.evictAccount(2L);

        assertThat(cache.getIfPresent(first)).isNotNull();
        assertThat(cache.getIfPresent(second)).isNull();
    }
}

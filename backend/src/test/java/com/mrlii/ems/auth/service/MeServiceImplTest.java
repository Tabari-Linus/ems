package com.mrlii.ems.auth.service;

import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.auth.dto.MeResult;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.security.AuthenticatedAccount;
import com.mrlii.ems.auth.service.impl.MeServiceImpl;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.service.EmployeeService;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeServiceImplTest {

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private EmployeeService employeeService;
    @InjectMocks private MeServiceImpl service;

    @Test
    void me_returnsAccountEmployeeAndSortedPermissions() {
        UserAccount account = AuthTestData.activeAccount();
        Instant lastLogin = Instant.parse("2026-05-01T08:00:00Z");
        account.setLastLoginAt(lastLogin);
        AuthenticatedAccount principal = new AuthenticatedAccount(1L, account.getPublicId(), account.getEmail(), 5L, 3L,
                Set.of(Permission.VIEW_SELF, Permission.VIEW_COMPANY));
        EmployeeDetailResult employee = mock(EmployeeDetailResult.class);
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(employeeService.getEmployee(5L)).thenReturn(employee);

        MeResult me = service.me(principal);

        assertThat(me.account().id()).isEqualTo(account.getPublicId().toString());
        assertThat(me.account().email()).isEqualTo("ama@example.com");
        assertThat(me.account().lastLoginAt()).isEqualTo(lastLogin.atOffset(ZoneOffset.UTC));
        assertThat(me.employee()).isSameAs(employee);
        assertThat(me.permissions()).containsExactly(Permission.VIEW_COMPANY, Permission.VIEW_SELF);
    }

    @Test
    void me_withoutEmployee_hasNullEmployeeAndLastLogin() {
        UserAccount account = AuthTestData.activeAccount();
        AuthenticatedAccount principal = new AuthenticatedAccount(1L, account.getPublicId(), "a@b.c", null, null, null);
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(account));

        MeResult me = service.me(principal);

        assertThat(me.employee()).isNull();
        assertThat(me.account().lastLoginAt()).isNull();
        assertThat(me.permissions()).isEmpty();
        verifyNoInteractions(employeeService);
    }

    @Test
    void me_missingAccount_throwsNotFound() {
        AuthenticatedAccount principal = new AuthenticatedAccount(9L, null, null, null, null, Set.of());
        when(userAccountRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.me(principal)).isInstanceOf(EntityNotFoundException.class);
    }
}

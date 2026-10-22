package com.mrlii.ems.organization.employee.controller;

import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.enums.IdentificationType;
import com.mrlii.ems.organization.employee.service.EmployeeSelfServiceService;
import com.mrlii.ems.organization.employee.util.EmployeeSecurityHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.mrlii.ems.support.TestcontainersConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@EnableMethodSecurity
class EmployeeSelfServiceControllerTest {

    @Autowired
    private EmployeeSelfServiceController controller;

    @MockitoBean
    private EmployeeSelfServiceService selfServiceService;

    @MockitoBean
    private EmployeeSecurityHelper securityHelper;

    // ── Mutation: updateMyBio ─────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void updateMyBio_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        var input = new EmployeeBioInput(null, null, null, null, null, null, null, null, null, null);
        assertThatCode(() -> controller.updateMyBio(input)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void updateMyBio_withViewSelfAuthority_throwsAccessDenied() {
        var input = new EmployeeBioInput(null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> controller.updateMyBio(input))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateMyBio_unauthenticated_throwsAuthenticationException() {
        var input = new EmployeeBioInput(null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> controller.updateMyBio(input))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    // ── Mutation: updateMyContact ─────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void updateMyContact_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        var input = new EmployeeContactInput(Set.of(), Set.of());
        assertThatCode(() -> controller.updateMyContact(input)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void updateMyContact_withViewSelfAuthority_throwsAccessDenied() {
        var input = new EmployeeContactInput(Set.of(), Set.of());
        assertThatThrownBy(() -> controller.updateMyContact(input))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Mutation: addMyAddress ────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void addMyAddress_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        var input = new EmployeeAddressInput(null, null, null, null, null, null, null);
        assertThatCode(() -> controller.addMyAddress(input)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void addMyAddress_withViewSelfAuthority_throwsAccessDenied() {
        var input = new EmployeeAddressInput(null, null, null, null, null, null, null);
        assertThatThrownBy(() -> controller.addMyAddress(input))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Mutation: updateMyAddress ─────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void updateMyAddress_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        var input = new EmployeeAddressInput(null, null, null, null, null, null, null);
        assertThatCode(() -> controller.updateMyAddress(1L, input)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void updateMyAddress_withViewSelfAuthority_throwsAccessDenied() {
        var input = new EmployeeAddressInput(null, null, null, null, null, null, null);
        assertThatThrownBy(() -> controller.updateMyAddress(1L, input))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Mutation: removeMyAddress ─────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void removeMyAddress_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        assertThatCode(() -> controller.removeMyAddress(1L)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void removeMyAddress_withViewSelfAuthority_throwsAccessDenied() {
        assertThatThrownBy(() -> controller.removeMyAddress(1L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void removeMyAddress_unauthenticated_throwsAuthenticationException() {
        assertThatThrownBy(() -> controller.removeMyAddress(1L))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    // ── Mutation: addMyIdentification ─────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void addMyIdentification_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        var input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        assertThatCode(() -> controller.addMyIdentification(input)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void addMyIdentification_withViewSelfAuthority_throwsAccessDenied() {
        var input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        assertThatThrownBy(() -> controller.addMyIdentification(input))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Mutation: removeMyIdentification ──────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void removeMyIdentification_withManageSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        assertThatCode(() -> controller.removeMyIdentification(1L)).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void removeMyIdentification_withViewSelfAuthority_throwsAccessDenied() {
        assertThatThrownBy(() -> controller.removeMyIdentification(1L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Query: getMyProfile ───────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "VIEW_SELF")
    void getMyProfile_withViewSelfAuthority_invokesService() {
        when(securityHelper.getCurrentEmployeeId()).thenReturn(1L);
        when(selfServiceService.getMyProfile(any())).thenReturn(null);
        assertThatCode(() -> controller.getMyProfile()).doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "MANAGE_SELF")
    void getMyProfile_withManageSelfAuthority_throwsAccessDenied() {
        assertThatThrownBy(() -> controller.getMyProfile())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getMyProfile_unauthenticated_throwsAuthenticationException() {
        assertThatThrownBy(() -> controller.getMyProfile())
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }
}

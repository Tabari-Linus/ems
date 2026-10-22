package com.mrlii.ems.dashboard.controller;

import com.mrlii.ems.dashboard.dto.DashboardFilterInput;
import com.mrlii.ems.dashboard.dto.DashboardSummaryResult;
import com.mrlii.ems.dashboard.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
@EnableMethodSecurity
class DashboardControllerTest {

    @Autowired
    private DashboardController dashboardController;

    @MockitoBean
    private DashboardService dashboardService;

    @Test
    @WithMockUser(authorities = "VIEW_DASHBOARD")
    void getDashboardSummary_withViewDashboardAuthority_invokesService() {
        when(dashboardService.getDashboardSummary(any())).thenReturn(mock(DashboardSummaryResult.class));

        var filter = mock(DashboardFilterInput.class);
        assertThatCode(() -> dashboardController.getDashboardSummary(filter))
                .doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_COMPANY")
    void getDashboardSummary_withUnrelatedAuthority_throwsAccessDenied() {
        var filter = mock(DashboardFilterInput.class);
        assertThatThrownBy(() -> dashboardController.getDashboardSummary(filter))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getDashboardSummary_unauthenticated_throwsAuthenticationException() {
        var filter = mock(DashboardFilterInput.class);
        assertThatThrownBy(() -> dashboardController.getDashboardSummary(filter))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    @WithMockUser(authorities = "VIEW_DASHBOARD")
    void getDashboardSummary_withNullFilter_invokesServiceWithNull() {
        when(dashboardService.getDashboardSummary(any())).thenReturn(mock(DashboardSummaryResult.class));

        assertThatCode(() -> dashboardController.getDashboardSummary(null))
                .doesNotThrowAnyException();
    }
}

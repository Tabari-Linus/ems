package com.mrlii.ems.organization.company.controller;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.organization.company.dto.CompanyDetailResult;
import com.mrlii.ems.organization.company.dto.CompanyResult;
import com.mrlii.ems.organization.company.dto.CreateCompanyInput;
import com.mrlii.ems.organization.company.dto.UpdateCompanyInput;
import com.mrlii.ems.organization.company.service.CompanyService;
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
class CompanyControllerTest {

    @Autowired
    private CompanyController companyController;

    @MockitoBean
    private CompanyService companyService;

    // ── Mutation: createCompany ────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_COMPANY")
    void createCompany_withManageCompanyAuthority_invokesService() {
        when(companyService.createCompany(any())).thenReturn(mock(CompanyResult.class));

        assertThatCode(() -> companyController.createCompany(mock(CreateCompanyInput.class)))
                .doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_COMPANY")
    void createCompany_withViewOnlyAuthority_throwsAccessDenied() {
        var input = mock(CreateCompanyInput.class);
        assertThatThrownBy(() -> companyController.createCompany(input))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createCompany_unauthenticated_throwsAuthenticationException() {
        var input = mock(CreateCompanyInput.class);
        assertThatThrownBy(() -> companyController.createCompany(input))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    // ── Query: getCompany ──────────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "VIEW_COMPANY")
    void getCompany_withViewCompanyAuthority_invokesService() {
        when(companyService.getCompany(any())).thenReturn(mock(CompanyDetailResult.class));

        assertThatCode(() -> companyController.getCompany(1L))
                .doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "MANAGE_COMPANY")
    void getCompany_withManageOnlyAuthority_throwsAccessDenied() {
        assertThatThrownBy(() -> companyController.getCompany(1L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Query: getCompanies ────────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "VIEW_COMPANY")
    void getCompanies_withViewCompanyAuthority_invokesService() {
        when(companyService.getCompanies(any(), any(), any())).thenReturn(mock(PageResult.class));

        assertThatCode(() -> companyController.getCompanies(
                mock(GeneralFilterInput.class), mock(PageInput.class), mock(SortInput.class)))
                .doesNotThrowAnyException();
    }

    @Test
    void getCompanies_unauthenticated_throwsAuthenticationException() {
        var filter = mock(GeneralFilterInput.class);
        var pageInput = mock(PageInput.class);
        var sortInput = mock(SortInput.class);
        assertThatThrownBy(() -> companyController.getCompanies(filter, pageInput, sortInput))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    // ── Mutations: update / archive / activate / delete ───────────────────────

    @Test
    @WithMockUser(authorities = "MANAGE_COMPANY")
    void updateCompany_withManageCompanyAuthority_invokesService() {
        when(companyService.updateCompany(any(), any())).thenReturn(mock(CompanyResult.class));

        assertThatCode(() -> companyController.updateCompany(1L, mock(UpdateCompanyInput.class)))
                .doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "MANAGE_COMPANY")
    void deleteCompany_withManageCompanyAuthority_invokesService() {
        when(companyService.deleteCompany(any())).thenReturn(mock(CompanyResult.class));

        assertThatCode(() -> companyController.deleteCompany(1L))
                .doesNotThrowAnyException();
    }

    @Test
    @WithMockUser(authorities = "VIEW_COMPANY")
    void deleteCompany_withViewOnlyAuthority_throwsAccessDenied() {
        assertThatThrownBy(() -> companyController.deleteCompany(1L))
                .isInstanceOf(AccessDeniedException.class);
    }
}

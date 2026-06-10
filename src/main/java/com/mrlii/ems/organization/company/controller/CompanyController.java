package com.mrlii.ems.organization.company.controller;

import com.mrlii.ems.organization.company.dto.*;
import com.mrlii.ems.organization.company.service.CompanyService;
import com.mrlii.ems.common.dto.*;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @MutationMapping
    public ApiResponse<CompanyResult> createCompany(
            @Argument @Valid CreateCompanyInput input
    ){
        CompanyResult data = companyService.createCompany(input);
        return ApiResponse.success(data, "Company created successfully");
    }

    @MutationMapping
    public ApiResponse<CompanyResult> updateCompany(
            @Argument Long companyId,
            @Argument @Valid UpdateCompanyInput input
    ){
        CompanyResult data = companyService.updateCompany(companyId, input);
        return ApiResponse.success(data, "Company updated successfully");
    }

    @MutationMapping
    public ApiResponse<CompanyResult> archiveCompany(
            @Argument Long companyId
    ){
        CompanyResult data = companyService.archiveCompany(companyId);
        return ApiResponse.success(data, "Company archived successfully");
    }

    @MutationMapping
    public ApiResponse<CompanyResult> activateCompany(
            @Argument Long id,
            @Argument Boolean active
    ){
        CompanyResult data = companyService.activateCompany(id, active);
        return ApiResponse.success(data, "Company activated successfully");
    }

    @MutationMapping
    public ApiResponse<CompanyResult> deleteCompany(
            @Argument Long companyId
    ) {
        CompanyResult data = companyService.deleteCompany(companyId);
        return ApiResponse.success(data, "Company deleted successfully");
    }

    @QueryMapping
    public CompanyDetailResult getCompany(
            @Argument Long id
    ) {
        return companyService.getCompany(id);
    }

    @QueryMapping
    public PageResult<CompanyListItemResult> getCompanies(
            @Argument GeneralFilterInput filter,
            @Argument PageInput pageInput,
            @Argument SortInput sortInput
            ) {
        return companyService.getCompanies(filter, pageInput, sortInput);
    }

}
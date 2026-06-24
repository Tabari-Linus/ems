package com.mrlii.ems.organization.department.controller;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ApiResponse;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.organization.department.dto.*;
import com.mrlii.ems.organization.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PreAuthorize("hasAuthority('MANAGE_DEPARTMENT')")
    @MutationMapping
    public ApiResponse<DepartmentResult> createDepartment(
            @Argument @Valid CreateDepartmentInput input
    ) {
        DepartmentResult data = departmentService.createDepartment(input);
        return ApiResponse.success(data, "Department created successfully");
    }

    @PreAuthorize("hasAuthority('MANAGE_DEPARTMENT')")
    @MutationMapping
    public ApiResponse<DepartmentResult> updateDepartment(
            @Argument Long id,
            @Argument @Valid UpdateDepartmentInput input
    ) {
        DepartmentResult data = departmentService.updateDepartment(id, input);
        return ApiResponse.success(data, "Department updated successfully");
    }

    @PreAuthorize("hasAuthority('MANAGE_DEPARTMENT')")
    @MutationMapping
    public ApiResponse<DepartmentResult> archiveDepartment(
            @Argument Long id
    ) {
        DepartmentResult data = departmentService.archiveDepartment(id);
        return ApiResponse.success(data, "Department archived successfully");
    }

    @PreAuthorize("hasAuthority('MANAGE_DEPARTMENT')")
    @MutationMapping
    public ApiResponse<DepartmentResult> activateDepartment(
            @Argument Long id,
            @Argument Boolean active
    ) {
        DepartmentResult data = departmentService.activateDepartment(id, active);
        return ApiResponse.success(data, "Department activation status updated successfully");
    }

    @PreAuthorize("hasAuthority('MANAGE_DEPARTMENT')")
    @MutationMapping
    public ApiResponse<DepartmentResult> deleteDepartment(
            @Argument Long id
    ) {
        DepartmentResult data = departmentService.deleteDepartment(id);
        return ApiResponse.success(data, "Department deleted successfully");
    }

    @PreAuthorize("hasAuthority('VIEW_DEPARTMENT')")
    @QueryMapping
    public DepartmentDetailResult getDepartment(
            @Argument Long id
    ) {
        return departmentService.getDepartment(id);
    }

    @PreAuthorize("hasAuthority('VIEW_DEPARTMENT')")
    @QueryMapping
    public PageResult<DepartmentListItemResult> getDepartments(
            @Argument Long officeId,
            @Argument GeneralFilterInput filter,
            @Argument PageInput pageInput,
            @Argument SortInput sortInput
    ) {
        return departmentService.getDepartments(officeId, filter, pageInput, sortInput);
    }
}

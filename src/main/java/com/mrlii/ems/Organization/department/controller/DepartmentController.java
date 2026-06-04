package com.mrlii.ems.Organization.department.controller;

import com.mrlii.ems.Organization.department.dto.*;
import com.mrlii.ems.Organization.department.service.DepartmentService;
import com.mrlii.ems.common.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @MutationMapping
    public ApiResponse<DepartmentResult> createDepartment(
            @Argument @Valid CreateDepartmentInput input
    ) {
        DepartmentResult data = departmentService.createDepartment(input);
        return ApiResponse.success(data, "Department created successfully");
    }

    @MutationMapping
    public ApiResponse<DepartmentResult> updateDepartment(
            @Argument Long id,
            @Argument @Valid UpdateDepartmentInput input
    ) {
        DepartmentResult data = departmentService.updateDepartment(id, input);
        return ApiResponse.success(data, "Department updated successfully");
    }

    @MutationMapping
    public ApiResponse<DepartmentResult> archiveDepartment(
            @Argument Long id
    ) {
        DepartmentResult data = departmentService.archiveDepartment(id);
        return ApiResponse.success(data, "Department archived successfully");
    }

    @MutationMapping
    public ApiResponse<DepartmentResult> activateDepartment(
            @Argument Long id,
            @Argument Boolean active
    ) {
        DepartmentResult data = departmentService.activateDepartment(id, active);
        return ApiResponse.success(data, "Department activation status updated successfully");
    }

    @MutationMapping
    public ApiResponse<DepartmentResult> deleteDepartment(
            @Argument Long id
    ) {
        DepartmentResult data = departmentService.deleteDepartment(id);
        return ApiResponse.success(data, "Department deleted successfully");
    }

    @QueryMapping
    public DepartmentDetailResult getDepartment(
            @Argument Long id
    ) {
        return departmentService.getDepartment(id);
    }

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

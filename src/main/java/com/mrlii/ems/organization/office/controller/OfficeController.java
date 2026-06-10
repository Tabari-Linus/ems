package com.mrlii.ems.organization.office.controller;

import com.mrlii.ems.organization.office.dto.*;
import com.mrlii.ems.organization.office.service.OfficeService;
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
public class OfficeController {

    private final OfficeService officeService;

    @MutationMapping
    public ApiResponse<OfficeResult> createOffice(
            @Argument @Valid CreateOfficeInput input
    ) {
        OfficeResult data = officeService.createOffice(input);
        return ApiResponse.success(data, "Office created successfully");
    }

    @MutationMapping
    public ApiResponse<OfficeResult> updateOffice(
            @Argument Long id,
            @Argument @Valid UpdateOfficeInput input
    ) {
        OfficeResult data = officeService.updateOffice(id, input);
        return ApiResponse.success(data, "Office updated successfully");
    }

    @MutationMapping
    public ApiResponse<OfficeResult> archiveOffice(
            @Argument Long id
    ) {
        OfficeResult data = officeService.archiveOffice(id);
        return ApiResponse.success(data, "Office archived successfully");
    }

    @MutationMapping
    public ApiResponse<OfficeResult> activateOffice(
            @Argument Long id,
            @Argument Boolean active
    ) {
        OfficeResult data = officeService.activateOffice(id, active);
        return ApiResponse.success(data, "Office activation status updated successfully");
    }

    @MutationMapping
    public ApiResponse<OfficeResult> deleteOffice(
            @Argument Long id
    ) {
        OfficeResult data = officeService.deleteOffice(id);
        return ApiResponse.success(data, "Office deleted successfully");
    }

    @QueryMapping
    public OfficeDetailResult getOffice(
            @Argument Long id
    ) {
        return officeService.getOffice(id);
    }

    @QueryMapping
    public PageResult<OfficeListItemResult> getOffices(
            @Argument Long companyId,
            @Argument GeneralFilterInput filter,
            @Argument PageInput pageInput,
            @Argument SortInput sortInput
    ) {
        return officeService.getOffices(companyId, filter, pageInput, sortInput);
    }
}

package com.mrlii.ems.organization.employee.controller;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.CreateEmployeeInput;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.dto.UpdateEmployeeInput;
import com.mrlii.ems.organization.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    // @PreAuthorize("hasAuthority('MANAGE_EMPLOYEE')")
    @MutationMapping
    public ActionResult createEmployee(@Argument @Valid CreateEmployeeInput input) {
        return employeeService.createEmployee(input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_EMPLOYEE')")
    @MutationMapping
    public ActionResult updateEmployee(@Argument Long id, @Argument @Valid UpdateEmployeeInput input) {
        return employeeService.updateEmployee(id, input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_EMPLOYEE')")
    @MutationMapping
    public ActionResult activateEmployee(@Argument Long id) {
        return employeeService.activateEmployee(id);
    }

    // @PreAuthorize("hasAuthority('MANAGE_EMPLOYEE')")
    @MutationMapping
    public ActionResult archiveEmployee(@Argument Long id) {
        return employeeService.archiveEmployee(id);
    }

    // @PreAuthorize("hasAuthority('MANAGE_EMPLOYEE')")
    @MutationMapping
    public ActionResult deleteEmployee(@Argument Long id) {
        return employeeService.deleteEmployee(id);
    }

    // @PreAuthorize("hasAuthority('VIEW_EMPLOYEE')")
    @QueryMapping
    public EmployeeDetailResult getEmployee(@Argument Long id) {
        return employeeService.getEmployee(id);
    }

    // @PreAuthorize("hasAuthority('VIEW_EMPLOYEE')")
    @QueryMapping
    public PageResult<EmployeeListItemResult> getEmployees(
            @Argument PageInput pageInput,
            @Argument SortInput sortInput,
            @Argument EmployeeFilterInput filter
    ) {
        return employeeService.getEmployees(pageInput, sortInput, filter);
    }
}

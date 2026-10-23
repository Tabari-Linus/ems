package com.mrlii.ems.organization.employee.service;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.CreateEmployeeInput;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.dto.UpdateEmployeeInput;

public interface EmployeeService {

    ActionResult createEmployee(CreateEmployeeInput input);

    ActionResult updateEmployee(Long id, UpdateEmployeeInput input);

    ActionResult activateEmployee(Long id);

    ActionResult archiveEmployee(Long id);

    ActionResult deleteEmployee(Long id);

    EmployeeDetailResult getEmployee(Long id);

    PageResult<EmployeeListItemResult> getEmployees(PageInput pageInput, SortInput sortInput, EmployeeFilterInput filter);
}

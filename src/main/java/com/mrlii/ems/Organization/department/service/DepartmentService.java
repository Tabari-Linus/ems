package com.mrlii.ems.Organization.department.service;

import com.mrlii.ems.Organization.department.dto.*;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;

public interface DepartmentService {

    DepartmentResult createDepartment(CreateDepartmentInput input);

    DepartmentResult updateDepartment(Long departmentId, UpdateDepartmentInput input);

    DepartmentResult archiveDepartment(Long departmentId);

    DepartmentResult activateDepartment(Long departmentId, Boolean active);

    DepartmentResult deleteDepartment(Long departmentId);

    DepartmentDetailResult getDepartment(Long id);

    PageResult<DepartmentListItemResult> getDepartments(Long officeId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput);
}

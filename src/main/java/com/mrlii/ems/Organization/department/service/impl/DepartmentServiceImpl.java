package com.mrlii.ems.Organization.department.service.impl;

import com.mrlii.ems.Organization.department.dto.*;
import com.mrlii.ems.Organization.department.entity.Department;
import com.mrlii.ems.Organization.department.helper.DepartmentPersistenceHelper;
import com.mrlii.ems.Organization.department.helper.DepartmentServiceHelper;
import com.mrlii.ems.Organization.department.service.DepartmentService;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.dto.PageInput;
import com.mrlii.ems.common.dto.PageResult;
import com.mrlii.ems.common.dto.SortInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentPersistenceHelper departmentPersistenceHelper;
    private final DepartmentServiceHelper departmentServiceHelper;

    @Override
    @Transactional
    public DepartmentResult createDepartment(CreateDepartmentInput input) {
        Department department = departmentPersistenceHelper.persistNewDepartment(input);
        log.info("Department created successfully: Id {}", department.getId());
        return DepartmentResult.of(department);
    }

    @Override
    @Transactional
    public DepartmentResult updateDepartment(Long id, UpdateDepartmentInput input) {
        Department department = departmentPersistenceHelper.updateDepartment(id, input);
        return DepartmentResult.of(department);
    }

    @Override
    @Transactional
    public DepartmentResult archiveDepartment(Long id) {
        Department department = departmentPersistenceHelper.archiveDepartment(id);
        return DepartmentResult.of(department);
    }

    @Override
    @Transactional
    public DepartmentResult activateDepartment(Long id, Boolean active) {
        Department department = departmentPersistenceHelper.activateDepartment(id, active);
        return DepartmentResult.of(department);
    }

    @Override
    @Transactional
    public DepartmentResult deleteDepartment(Long id) {
        Department department = departmentPersistenceHelper.deleteDepartment(id);
        return DepartmentResult.of(department);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDetailResult getDepartment(Long id) {
        Department department = departmentServiceHelper.getDepartmentById(id);
        return DepartmentDetailResult.of(department);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<DepartmentListItemResult> getDepartments(Long officeId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        return departmentServiceHelper.getDepartments(officeId, filter, pageInput, sortInput);
    }
}

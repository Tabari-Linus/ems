package com.mrlii.ems.organization.employee.service.impl;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.CreateEmployeeInput;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.dto.UpdateEmployeeInput;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.helper.EmployeePersistenceHelper;
import com.mrlii.ems.organization.employee.helper.EmployeeServiceHelper;
import com.mrlii.ems.organization.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeePersistenceHelper persistenceHelper;
    private final EmployeeServiceHelper serviceHelper;

    @Override
    @Transactional
    public ActionResult createEmployee(CreateEmployeeInput input) {
        Employee employee = persistenceHelper.create(input);
        log.info("Employee created: id={}, email={}", employee.getId(), employee.getWorkEmail());
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    @Transactional
    public ActionResult updateEmployee(Long id, UpdateEmployeeInput input) {
        Employee employee = persistenceHelper.update(id, input);
        log.info("Employee updated: id={}", id);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    @Transactional
    public ActionResult activateEmployee(Long id) {
        Employee employee = persistenceHelper.activate(id);
        log.info("Employee activated: id={}", id);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    @Transactional
    public ActionResult archiveEmployee(Long id) {
        Employee employee = persistenceHelper.archive(id);
        log.info("Employee archived: id={}", id);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    @Transactional
    public ActionResult deleteEmployee(Long id) {
        Employee employee = serviceHelper.findByIdOrThrow(id);
        persistenceHelper.softDelete(id);
        log.info("Employee deleted: id={}", id);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeDetailResult getEmployee(Long id) {
        return serviceHelper.getEmployeeDetail(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<EmployeeListItemResult> getEmployees(
            PageInput pageInput, SortInput sortInput, EmployeeFilterInput filter) {
        return serviceHelper.getEmployees(filter, pageInput, sortInput);
    }
}

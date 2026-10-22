package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeAddressRepository;
import com.mrlii.ems.organization.employee.repository.EmployeeIdentificationRepository;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import com.mrlii.ems.organization.employee.util.EmployeeSpecification;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EmployeeServiceHelper {

    private final EmployeeRepository employeeRepository;
    private final EmployeeAddressRepository addressRepository;
    private final EmployeeIdentificationRepository identificationRepository;
    private final EmployeeValidator validator;
    private final PaginationHelper paginationHelper;

    public Employee findByIdOrThrow(Long id) {
        return validator.findByIdOrThrow(id);
    }

    public EmployeeDetailResult getEmployeeDetail(Long id) {
        Employee employee = validator.findByIdOrThrow(id);
        return EmployeeDetailResult.of(
                employee,
                addressRepository.findAllByEmployee_Id(id),
                identificationRepository.findAllByEmployee_Id(id)
        );
    }

    public PageResult<EmployeeListItemResult> getEmployees(
            EmployeeFilterInput filter, PageInput pageInput, SortInput sortInput) {

        List<Specification<Employee>> specs = new ArrayList<>();
        specs.add(EmployeeSpecification.notDeleted());

        if (filter != null) {
            if (filter.status() != null) {
                specs.add(EmployeeSpecification.hasStatus(filter.status()));
            }
            if (filter.departmentId() != null) {
                specs.add(EmployeeSpecification.hasDepartment(filter.departmentId()));
            }
            if (filter.positionId() != null) {
                specs.add(EmployeeSpecification.hasPosition(filter.positionId()));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                specs.add(EmployeeSpecification.matchesSearch(filter.search()));
            }
        }

        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<Employee> page = employeeRepository.findAll(Specification.allOf(specs), pageable);

        return PageResult.of(page, EmployeeListItemResult::of);
    }
}

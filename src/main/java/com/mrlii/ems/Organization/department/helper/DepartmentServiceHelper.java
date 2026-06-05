package com.mrlii.ems.Organization.department.helper;

import com.mrlii.ems.Organization.department.dto.DepartmentListItemResult;
import com.mrlii.ems.Organization.department.entity.Department;
import com.mrlii.ems.Organization.department.repository.DepartmentRepository;
import com.mrlii.ems.Organization.department.util.DepartmentSpecification;
import com.mrlii.ems.common.dto.*;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.InputValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DepartmentServiceHelper {

    private final DepartmentRepository departmentRepository;
    private final PaginationHelper paginationHelper;

    public void validateUniqueName(String departmentName) {
        if (departmentName != null && departmentRepository.existsByDepartmentNameIgnoreCase(departmentName)) {
            throw new InputValidationException(
                    "A department with the name '%s' already exists".formatted(departmentName));
        }
    }

    public void validateUniqueCode(String departmentCode) {
        if (departmentCode != null && departmentRepository.existsByDepartmentCodeIgnoreCase(departmentCode)) {
            throw new InputValidationException(
                    "A department with the code '%s' already exists".formatted(departmentCode));
        }
    }

    public void validateUniqueEmail(String departmentEmail) {
        if (departmentEmail != null && departmentRepository.existsByDepartmentEmailIgnoreCase(departmentEmail)) {
            throw new InputValidationException(
                    "A department with the email '%s' already exists".formatted(departmentEmail));
        }
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new InputValidationException(
                        "Department with ID %d does not exist".formatted(id)));
    }

    public PageResult<DepartmentListItemResult> getDepartments(Long officeId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        CommonStatus status = filter != null ? filter.status() : null;
        String search = filter != null ? filter.search() : null;

        List<Specification<Department>> specs = new ArrayList<>();

        if (officeId != null) {
            specs.add(DepartmentSpecification.belongsToOffice(officeId));
        }
        if (status != null) {
            specs.add(DepartmentSpecification.hasStatus(status.name()));
        }
        if (search != null && !search.isBlank()) {
            specs.add(DepartmentSpecification.matchesSearch(search));
        }

        Specification<Department> spec = Specification.allOf(specs);
        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<Department> departmentPage = departmentRepository.findAll(spec, pageable);

        return PageResult.of(departmentPage, DepartmentListItemResult::of);
    }
}

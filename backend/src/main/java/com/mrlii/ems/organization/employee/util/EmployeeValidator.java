package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmployeeValidator {

    private final EmployeeRepository employeeRepository;

    public void validateEmailIsUnique(String workEmail) {
        if (employeeRepository.existsByWorkEmailIgnoreCase(workEmail)) {
            throw new DuplicateEntityException(
                    "An employee with email '%s' already exists".formatted(workEmail));
        }
    }

    public void validateEmailIsUniqueForUpdate(Long id, String workEmail) {
        if (employeeRepository.existsByWorkEmailIgnoreCaseAndIdNot(workEmail, id)) {
            throw new DuplicateEntityException(
                    "An employee with email '%s' already exists".formatted(workEmail));
        }
    }

    public Employee findByIdOrThrow(Long id) {
        return employeeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Employee with ID %d not found".formatted(id)));
    }
}

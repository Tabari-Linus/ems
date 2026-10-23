package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeValidatorTest {

    @Mock private EmployeeRepository employeeRepository;
    @InjectMocks private EmployeeValidator validator;

    @Test
    void validateEmailIsUnique_whenEmailNotTaken_doesNotThrow() {
        when(employeeRepository.existsByWorkEmailIgnoreCase("john@test.com")).thenReturn(false);

        validator.validateEmailIsUnique("john@test.com");
    }

    @Test
    void validateEmailIsUnique_whenEmailAlreadyExists_throwsDuplicateEntityException() {
        when(employeeRepository.existsByWorkEmailIgnoreCase("john@test.com")).thenReturn(true);

        assertThatThrownBy(() -> validator.validateEmailIsUnique("john@test.com"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("john@test.com");
    }

    @Test
    void validateEmailIsUniqueForUpdate_whenEmailNotTakenByOther_doesNotThrow() {
        when(employeeRepository.existsByWorkEmailIgnoreCaseAndIdNot("john@test.com", 1L)).thenReturn(false);

        validator.validateEmailIsUniqueForUpdate(1L, "john@test.com");
    }

    @Test
    void validateEmailIsUniqueForUpdate_whenEmailTakenByOther_throwsDuplicateEntityException() {
        when(employeeRepository.existsByWorkEmailIgnoreCaseAndIdNot("john@test.com", 1L)).thenReturn(true);

        assertThatThrownBy(() -> validator.validateEmailIsUniqueForUpdate(1L, "john@test.com"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("john@test.com");
    }

    @Test
    void findByIdOrThrow_whenEmployeeExists_returnsEmployee() {
        Employee employee = buildEmployee(1L, "john@test.com");
        when(employeeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(employee));

        Employee result = validator.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(employee);
    }

    @Test
    void findByIdOrThrow_whenEmployeeNotFound_throwsEntityNotFoundException() {
        when(employeeRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> validator.findByIdOrThrow(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    private Employee buildEmployee(Long id, String email) {
        return Employee.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .workEmail(email)
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

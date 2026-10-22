package com.mrlii.ems.accesslevel.util;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.entity.Employee;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessLevelValidatorTest {

    @Mock private AccessLevelRepository accessLevelRepository;
    @Mock private PermissionSetRepository permissionSetRepository;
    @InjectMocks private AccessLevelValidator validator;

    // ── validateNameIsUnique ──────────────────────────────────────────────────

    @Test
    void validateNameIsUnique_whenNameDoesNotExist_doesNotThrow() {
        when(accessLevelRepository.existsByAccessLevelNameIgnoreCase("Admin")).thenReturn(false);

        assertThatCode(() -> validator.validateNameIsUnique("Admin"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateNameIsUnique_whenNameAlreadyExists_throwsDuplicateEntityException() {
        when(accessLevelRepository.existsByAccessLevelNameIgnoreCase("Admin")).thenReturn(true);

        assertThatThrownBy(() -> validator.validateNameIsUnique("Admin"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("Admin");
    }

    // ── validateNameIsUniqueForUpdate ─────────────────────────────────────────

    @Test
    void validateNameIsUniqueForUpdate_whenNameIsAvailable_doesNotThrow() {
        when(accessLevelRepository.existsByAccessLevelNameIgnoreCaseAndIdNot("Admin", 1L)).thenReturn(false);

        assertThatCode(() -> validator.validateNameIsUniqueForUpdate(1L, "Admin"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateNameIsUniqueForUpdate_whenNameTakenByOtherEntity_throwsDuplicateEntityException() {
        when(accessLevelRepository.existsByAccessLevelNameIgnoreCaseAndIdNot("Admin", 1L)).thenReturn(true);

        assertThatThrownBy(() -> validator.validateNameIsUniqueForUpdate(1L, "Admin"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("Admin");
    }

    // ── findByIdOrThrow ───────────────────────────────────────────────────────

    @Test
    void findByIdOrThrow_whenEntityExists_returnsAccessLevel() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        when(accessLevelRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(accessLevel));

        AccessLevel result = validator.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(accessLevel);
    }

    @Test
    void findByIdOrThrow_whenEntityNotFound_throwsEntityNotFoundException() {
        when(accessLevelRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> validator.findByIdOrThrow(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── validateNotAssignedToEmployees ────────────────────────────────────────

    @Test
    void validateNotAssignedToEmployees_whenNullEmployeeList_doesNotThrow() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setEmployees(null);

        assertThatCode(() -> validator.validateNotAssignedToEmployees(accessLevel))
                .doesNotThrowAnyException();
    }

    @Test
    void validateNotAssignedToEmployees_whenEmptyEmployeeList_doesNotThrow() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setEmployees(List.of());

        assertThatCode(() -> validator.validateNotAssignedToEmployees(accessLevel))
                .doesNotThrowAnyException();
    }

    @Test
    void validateNotAssignedToEmployees_whenEmployeesAssigned_throwsBusinessRuleViolationException() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setEmployees(List.of(
                Employee.builder().id(1L).firstName("John").lastName("Doe").workEmail("john@test.com").build(),
                Employee.builder().id(2L).firstName("Jane").lastName("Doe").workEmail("jane@test.com").build()
        ));

        assertThatThrownBy(() -> validator.validateNotAssignedToEmployees(accessLevel))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Admin")
                .hasMessageContaining("2");
    }

    // ── validatePermissionsNotDuplicate ───────────────────────────────────────

    @Test
    void validatePermissionsNotDuplicate_whenNoDuplicates_doesNotThrow() {
        when(permissionSetRepository.existsByAccessLevelIdAndPermissionName(1L, Permission.VIEW_EMPLOYEE)).thenReturn(false);
        when(permissionSetRepository.existsByAccessLevelIdAndPermissionName(1L, Permission.MANAGE_EMPLOYEE)).thenReturn(false);

        assertThatCode(() -> validator.validatePermissionsNotDuplicate(
                1L, List.of(Permission.VIEW_EMPLOYEE, Permission.MANAGE_EMPLOYEE)))
                .doesNotThrowAnyException();
    }

    @Test
    void validatePermissionsNotDuplicate_whenDuplicatesExist_throwsDuplicateEntityExceptionWithAllDuplicates() {
        when(permissionSetRepository.existsByAccessLevelIdAndPermissionName(1L, Permission.VIEW_EMPLOYEE)).thenReturn(true);
        when(permissionSetRepository.existsByAccessLevelIdAndPermissionName(1L, Permission.MANAGE_EMPLOYEE)).thenReturn(true);
        when(permissionSetRepository.existsByAccessLevelIdAndPermissionName(1L, Permission.VIEW_COMPANY)).thenReturn(false);

        List<Permission> permissionList = List.of(Permission.VIEW_EMPLOYEE, Permission.MANAGE_EMPLOYEE, Permission.VIEW_COMPANY);
        assertThatThrownBy(() -> validator.validatePermissionsNotDuplicate(
                1L, permissionList))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("VIEW_EMPLOYEE")
                .hasMessageContaining("MANAGE_EMPLOYEE");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AccessLevel buildAccessLevel(Long id, String name) {
        return AccessLevel.builder()
                .id(id)
                .accessLevelName(name)
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

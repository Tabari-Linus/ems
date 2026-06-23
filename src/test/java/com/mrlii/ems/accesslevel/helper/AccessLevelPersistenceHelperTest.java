package com.mrlii.ems.accesslevel.helper;

import com.mrlii.ems.accesslevel.dto.CreateAccessLevelInput;
import com.mrlii.ems.accesslevel.dto.UpdateAccessLevelInput;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.accesslevel.util.AccessLevelValidator;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessLevelPersistenceHelperTest {

    @Mock private AccessLevelRepository accessLevelRepository;
    @Mock private PermissionSetRepository permissionSetRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private AccessLevelValidator validator;
    @Mock private CommonUtilHelper commonUtilHelper;
    @InjectMocks private AccessLevelPersistenceHelper persistenceHelper;

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_withValidInput_savesAccessLevelWithActiveStatusAndPermissions() {
        CreateAccessLevelInput input = new CreateAccessLevelInput(
                "Admin", "Admin level", List.of(Permission.VIEW_EMPLOYEE, Permission.MANAGE_EMPLOYEE), null);
        AccessLevel saved = buildAccessLevel(1L, "Admin");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(accessLevelRepository.save(any())).thenReturn(saved);

        AccessLevel result = persistenceHelper.create(input);

        assertThat(result).isEqualTo(saved);
        ArgumentCaptor<AccessLevel> captor = ArgumentCaptor.forClass(AccessLevel.class);
        verify(accessLevelRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(CommonStatus.ACTIVE);
        verify(permissionSetRepository).saveAll(anyList());
        verify(validator).validateNameIsUnique("Admin");
    }

    @Test
    void create_withEmployeeIds_assignsEmployeesToAccessLevel() {
        CreateAccessLevelInput input = new CreateAccessLevelInput(
                "Admin", null, List.of(Permission.VIEW_EMPLOYEE), List.of(10L, 20L));
        AccessLevel saved = buildAccessLevel(1L, "Admin");
        Employee emp1 = Employee.builder().id(10L).workEmail("e1@test.com").build();
        Employee emp2 = Employee.builder().id(20L).workEmail("e2@test.com").build();
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(accessLevelRepository.save(any())).thenReturn(saved);
        when(employeeRepository.findAllById(List.of(10L, 20L))).thenReturn(List.of(emp1, emp2));

        persistenceHelper.create(input);

        ArgumentCaptor<List<Employee>> captor = ArgumentCaptor.forClass(List.class);
        verify(employeeRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).allMatch(e -> e.getAccessLevel() == saved);
    }

    @Test
    void create_withNullEmployeeIds_skipsEmployeeAssignment() {
        CreateAccessLevelInput input = new CreateAccessLevelInput(
                "Admin", null, List.of(Permission.VIEW_EMPLOYEE), null);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(accessLevelRepository.save(any())).thenReturn(buildAccessLevel(1L, "Admin"));

        persistenceHelper.create(input);

        verify(employeeRepository, never()).findAllById(anyList());
        verify(employeeRepository, never()).saveAll(anyList());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_withNewName_validatesUniquenessAndUpdatesName() {
        AccessLevel existing = buildAccessLevel(1L, "OldName");
        UpdateAccessLevelInput input = new UpdateAccessLevelInput("NewName", null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(commonUtilHelper.normalizeName("NewName")).thenReturn("NewName");
        when(accessLevelRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        verify(validator).validateNameIsUniqueForUpdate(1L, "NewName");
        assertThat(existing.getAccessLevelName()).isEqualTo("NewName");
    }

    @Test
    void update_withNullName_skipsNameUpdateAndValidation() {
        AccessLevel existing = buildAccessLevel(1L, "Admin");
        UpdateAccessLevelInput input = new UpdateAccessLevelInput(null, "New description", null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(accessLevelRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        verify(validator, never()).validateNameIsUniqueForUpdate(any(), any());
        assertThat(existing.getAccessLevelName()).isEqualTo("Admin");
        assertThat(existing.getDescription()).isEqualTo("New description");
    }

    @Test
    void update_withAddEmployeeIds_assignsEmployees() {
        AccessLevel existing = buildAccessLevel(1L, "Admin");
        UpdateAccessLevelInput input = new UpdateAccessLevelInput(null, null, List.of(5L), null);
        Employee emp = Employee.builder().id(5L).workEmail("e@test.com").build();
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(accessLevelRepository.save(any())).thenReturn(existing);
        when(employeeRepository.findAllById(List.of(5L))).thenReturn(List.of(emp));

        persistenceHelper.update(1L, input);

        verify(employeeRepository).saveAll(anyList());
        assertThat(emp.getAccessLevel()).isEqualTo(existing);
    }

    @Test
    void update_withRemoveEmployeeIds_unassignsEmployees() {
        AccessLevel existing = buildAccessLevel(1L, "Admin");
        UpdateAccessLevelInput input = new UpdateAccessLevelInput(null, null, null, List.of(5L));
        Employee emp = Employee.builder().id(5L).workEmail("e@test.com").accessLevel(existing).build();
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(accessLevelRepository.save(any())).thenReturn(existing);
        when(employeeRepository.findAllById(List.of(5L))).thenReturn(List.of(emp));

        persistenceHelper.update(1L, input);

        verify(employeeRepository).saveAll(anyList());
        assertThat(emp.getAccessLevel()).isNull();
    }

    // ── status transitions ────────────────────────────────────────────────────

    @Test
    void activate_setsStatusToActive() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setStatus(CommonStatus.ARCHIVED);
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);
        when(accessLevelRepository.save(any())).thenReturn(accessLevel);

        AccessLevel result = persistenceHelper.activate(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ACTIVE);
        verify(accessLevelRepository).save(accessLevel);
    }

    @Test
    void archive_setsStatusToArchived() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setStatus(CommonStatus.ACTIVE);
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);
        when(accessLevelRepository.save(any())).thenReturn(accessLevel);

        AccessLevel result = persistenceHelper.archive(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
    }

    @Test
    void softDelete_setsArchivedStatusAndDeletedAt() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        accessLevel.setEmployees(List.of());
        LocalDateTime now = LocalDateTime.now();
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);
        when(commonUtilHelper.getCurrentDateTime()).thenReturn(now);

        persistenceHelper.softDelete(1L);

        verify(validator).validateNotAssignedToEmployees(accessLevel);
        assertThat(accessLevel.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
        assertThat(accessLevel.getDeletedAt()).isEqualTo(now);
        verify(accessLevelRepository).save(accessLevel);
    }

    // ── permissions ───────────────────────────────────────────────────────────

    @Test
    void addPermissions_savesNewPermissionSets() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        List<Permission> permissions = List.of(Permission.VIEW_COMPANY, Permission.MANAGE_COMPANY);
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);

        persistenceHelper.addPermissions(1L, permissions);

        verify(validator).validatePermissionsNotDuplicate(1L, permissions);
        ArgumentCaptor<List<PermissionSet>> captor = ArgumentCaptor.forClass(List.class);
        verify(permissionSetRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue()).allMatch(ps -> ps.getAccessLevel() == accessLevel);
    }

    @Test
    void removePermissions_deletesFromRepository() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        List<Permission> permissions = List.of(Permission.VIEW_COMPANY);
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);

        persistenceHelper.removePermissions(1L, permissions);

        verify(permissionSetRepository).deleteAllByAccessLevelIdAndPermissionNameIn(1L, permissions);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AccessLevel buildAccessLevel(Long id, String name) {
        AccessLevel accessLevel = AccessLevel.builder()
                .id(id)
                .accessLevelName(name)
                .status(CommonStatus.ACTIVE)
                .build();
        accessLevel.setPermissions(new HashSet<>());
        accessLevel.setEmployees(List.of());
        return accessLevel;
    }
}

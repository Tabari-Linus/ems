package com.mrlii.ems.organization.employee.service;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.CreateEmployeeInput;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.dto.UpdateEmployeeInput;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.helper.EmployeePersistenceHelper;
import com.mrlii.ems.organization.employee.helper.EmployeeServiceHelper;
import com.mrlii.ems.organization.employee.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock private EmployeePersistenceHelper persistenceHelper;
    @Mock private EmployeeServiceHelper serviceHelper;
    @InjectMocks private EmployeeServiceImpl service;

    // ── mutations ─────────────────────────────────────────────────────────────

    @Test
    void createEmployee_success_returnsActionResult() {
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, null);
        when(persistenceHelper.create(input)).thenReturn(buildEmployee(1L));

        ActionResult result = service.createEmployee(input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("John Doe");
    }

    @Test
    void updateEmployee_success_returnsActionResult() {
        UpdateEmployeeInput input = new UpdateEmployeeInput("Jane", null, null, null, null, null, null, null);
        Employee updated = Employee.builder().id(1L).firstName("Jane").lastName("Doe")
                .status(CommonStatus.ACTIVE).build();
        when(persistenceHelper.update(1L, input)).thenReturn(updated);

        ActionResult result = service.updateEmployee(1L, input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Jane Doe");
    }

    @Test
    void activateEmployee_success_returnsActionResult() {
        when(persistenceHelper.activate(1L)).thenReturn(buildEmployee(1L));

        ActionResult result = service.activateEmployee(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).activate(1L);
    }

    @Test
    void archiveEmployee_success_returnsActionResult() {
        when(persistenceHelper.archive(1L)).thenReturn(buildEmployee(1L));

        ActionResult result = service.archiveEmployee(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).archive(1L);
    }

    @Test
    void deleteEmployee_success_returnsActionResult() {
        Employee employee = buildEmployee(1L);
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(employee);

        ActionResult result = service.deleteEmployee(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("John Doe");
        verify(persistenceHelper).softDelete(1L);
    }

    @Test
    void deleteEmployee_whenNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.findByIdOrThrow(99L))
                .thenThrow(new EntityNotFoundException("Employee with ID 99 not found"));

        assertThatThrownBy(() -> service.deleteEmployee(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── queries ───────────────────────────────────────────────────────────────

    @Test
    void getEmployee_success_returnsDetailResult() {
        EmployeeDetailResult detail = mock(EmployeeDetailResult.class);
        when(serviceHelper.getEmployeeDetail(1L)).thenReturn(detail);

        EmployeeDetailResult result = service.getEmployee(1L);

        assertThat(result).isEqualTo(detail);
        verify(serviceHelper).getEmployeeDetail(1L);
    }

    @Test
    void getEmployee_whenNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.getEmployeeDetail(99L))
                .thenThrow(new EntityNotFoundException("Employee with ID 99 not found"));

        assertThatThrownBy(() -> service.getEmployee(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getEmployees_success_returnsPageResult() {
        PageResult<EmployeeListItemResult> expected = new PageResult<>(0, 0, 0, 20, false, false, List.of());
        when(serviceHelper.getEmployees(any(), any(), any())).thenReturn(expected);

        PageResult<EmployeeListItemResult> result = service.getEmployees(new PageInput(0, 20), null, null);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getEmployees_withFilter_delegatesToServiceHelper() {
        EmployeeFilterInput filter = new EmployeeFilterInput(CommonStatus.ACTIVE, "john", 1L, 2L);
        PageResult<EmployeeListItemResult> expected = new PageResult<>(0, 1, 1, 20, false, false, List.of());
        when(serviceHelper.getEmployees(filter, null, null)).thenReturn(expected);

        PageResult<EmployeeListItemResult> result = service.getEmployees(null, null, filter);

        assertThat(result).isEqualTo(expected);
        verify(serviceHelper).getEmployees(filter, null, null);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Employee buildEmployee(Long id) {
        return Employee.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .workEmail("john@test.com")
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

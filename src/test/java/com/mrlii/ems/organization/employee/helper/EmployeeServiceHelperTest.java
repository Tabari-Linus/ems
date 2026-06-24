package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.dto.EmployeeFilterInput;
import com.mrlii.ems.organization.employee.dto.EmployeeListItemResult;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeAddressRepository;
import com.mrlii.ems.organization.employee.repository.EmployeeIdentificationRepository;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceHelperTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeAddressRepository addressRepository;
    @Mock private EmployeeIdentificationRepository identificationRepository;
    @Mock private EmployeeValidator validator;
    @Mock private PaginationHelper paginationHelper;
    @InjectMocks private EmployeeServiceHelper serviceHelper;

    @Test
    void findByIdOrThrow_delegatesToValidator() {
        Employee employee = buildEmployee(1L);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        Employee result = serviceHelper.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(employee);
        verify(validator).findByIdOrThrow(1L);
    }

    @Test
    void getEmployeeDetail_buildsDetailResultWithSubEntities() {
        Employee employee = buildEmployee(1L);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(addressRepository.findAllByEmployee_Id(1L)).thenReturn(List.of());
        when(identificationRepository.findAllByEmployee_Id(1L)).thenReturn(List.of());

        var result = serviceHelper.getEmployeeDetail(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.addresses()).isEmpty();
        assertThat(result.identifications()).isEmpty();
        verify(addressRepository).findAllByEmployee_Id(1L);
        verify(identificationRepository).findAllByEmployee_Id(1L);
    }

    @Test
    void getEmployees_withNullFilter_returnsPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(employeeRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<EmployeeListItemResult> result = serviceHelper.getEmployees(null, null, null);

        assertThat(result).isNotNull();
        assertThat(result.data()).isEmpty();
    }

    @Test
    void getEmployees_withStatusFilter_returnsFilteredPage() {
        EmployeeFilterInput filter = new EmployeeFilterInput(CommonStatus.ACTIVE, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(buildEmployee(1L)));
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(employeeRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<EmployeeListItemResult> result = serviceHelper.getEmployees(filter, new PageInput(0, 20), null);

        assertThat(result.data()).hasSize(1);
    }

    @Test
    void getEmployees_withAllFilters_buildsFullSpecification() {
        EmployeeFilterInput filter = new EmployeeFilterInput(CommonStatus.ACTIVE, "john", 2L, 3L);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Employee> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(employeeRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        serviceHelper.getEmployees(filter, new PageInput(0, 10), new SortInput("lastName", null));

        verify(paginationHelper).buildPageable(any(), any());
        verify(employeeRepository).findAll(any(Specification.class), any(Pageable.class));
    }

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

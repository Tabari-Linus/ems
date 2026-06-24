package com.mrlii.ems.organization.employee.service;

import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.entity.EmployeeAddress;
import com.mrlii.ems.organization.employee.entity.EmployeeIdentification;
import com.mrlii.ems.organization.employee.enums.IdentificationType;
import com.mrlii.ems.organization.employee.helper.EmployeeSelfServiceHelper;
import com.mrlii.ems.organization.employee.helper.EmployeeServiceHelper;
import com.mrlii.ems.organization.employee.service.impl.EmployeeSelfServiceServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeSelfServiceServiceImplTest {

    @Mock private EmployeeSelfServiceHelper selfServiceHelper;
    @Mock private EmployeeServiceHelper serviceHelper;
    @InjectMocks private EmployeeSelfServiceServiceImpl service;

    // ── updateMyBio ───────────────────────────────────────────────────────────

    @Test
    void updateMyBio_success_returnsActionResultWithEmployeeName() {
        EmployeeBioInput input = new EmployeeBioInput("John Doe", null, "Male", null, null, null, null, null, null, null);
        when(selfServiceHelper.updateMyBio(1L, input)).thenReturn(buildEmployee(1L));

        ActionResult result = service.updateMyBio(1L, input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("John Doe");
    }

    // ── updateMyContact ───────────────────────────────────────────────────────

    @Test
    void updateMyContact_success_returnsActionResultWithEmployeeName() {
        EmployeeContactInput input = new EmployeeContactInput(Set.of("+233201234567"), Set.of());
        when(selfServiceHelper.updateMyContact(1L, input)).thenReturn(buildEmployee(1L));

        ActionResult result = service.updateMyContact(1L, input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("John Doe");
    }

    // ── addMyAddress ──────────────────────────────────────────────────────────

    @Test
    void addMyAddress_success_returnsAddressIdAndLabel() {
        EmployeeAddressInput input = new EmployeeAddressInput("1 Main St", "Accra", null, null, "Ghana", null, true);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).city("Accra").country("Ghana").build();
        when(selfServiceHelper.addMyAddress(1L, input)).thenReturn(address);

        ActionResult result = service.addMyAddress(1L, input);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.name()).isEqualTo("Accra, Ghana");
    }

    @Test
    void addMyAddress_whenCityIsNull_returnsCountryOnly() {
        EmployeeAddressInput input = new EmployeeAddressInput(null, null, null, null, "Ghana", null, false);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).country("Ghana").build();
        when(selfServiceHelper.addMyAddress(1L, input)).thenReturn(address);

        ActionResult result = service.addMyAddress(1L, input);

        assertThat(result.name()).isEqualTo("Ghana");
    }

    // ── updateMyAddress ───────────────────────────────────────────────────────

    @Test
    void updateMyAddress_success_returnsUpdatedAddressLabel() {
        EmployeeAddressInput input = new EmployeeAddressInput("2 New St", "Kumasi", null, null, "Ghana", null, false);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).city("Kumasi").country("Ghana").build();
        when(selfServiceHelper.updateMyAddress(1L, 10L, input)).thenReturn(address);

        ActionResult result = service.updateMyAddress(1L, 10L, input);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.name()).isEqualTo("Kumasi, Ghana");
    }

    @Test
    void updateMyAddress_whenNotOwned_propagatesEntityNotFoundException() {
        EmployeeAddressInput input = new EmployeeAddressInput(null, null, null, null, null, null, false);
        when(selfServiceHelper.updateMyAddress(1L, 99L, input))
                .thenThrow(new EntityNotFoundException("Address with ID 99 not found for this employee"));

        assertThatThrownBy(() -> service.updateMyAddress(1L, 99L, input))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── removeMyAddress ───────────────────────────────────────────────────────

    @Test
    void removeMyAddress_success_returnsRemovedResult() {
        doNothing().when(selfServiceHelper).removeMyAddress(1L, 10L);

        ActionResult result = service.removeMyAddress(1L, 10L);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.name()).isEqualTo("Removed");
        verify(selfServiceHelper).removeMyAddress(1L, 10L);
    }

    @Test
    void removeMyAddress_whenNotOwned_propagatesEntityNotFoundException() {
        doThrow(new EntityNotFoundException("Address with ID 99 not found for this employee"))
                .when(selfServiceHelper).removeMyAddress(1L, 99L);

        assertThatThrownBy(() -> service.removeMyAddress(1L, 99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── addMyIdentification ───────────────────────────────────────────────────

    @Test
    void addMyIdentification_success_returnsIdentificationIdAndNumber() {
        EmployeeIdentificationInput input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        EmployeeIdentification identification = EmployeeIdentification.builder()
                .id(5L).identificationNumber("GHA-001").build();
        when(selfServiceHelper.addMyIdentification(1L, input)).thenReturn(identification);

        ActionResult result = service.addMyIdentification(1L, input);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.name()).isEqualTo("GHA-001");
    }

    @Test
    void addMyIdentification_whenDuplicateNumber_propagatesDuplicateEntityException() {
        EmployeeIdentificationInput input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        when(selfServiceHelper.addMyIdentification(1L, input))
                .thenThrow(new DuplicateEntityException("Identification number 'GHA-001' is already registered"));

        assertThatThrownBy(() -> service.addMyIdentification(1L, input))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("GHA-001");
    }

    // ── removeMyIdentification ────────────────────────────────────────────────

    @Test
    void removeMyIdentification_success_returnsRemovedResult() {
        doNothing().when(selfServiceHelper).removeMyIdentification(1L, 5L);

        ActionResult result = service.removeMyIdentification(1L, 5L);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.name()).isEqualTo("Removed");
        verify(selfServiceHelper).removeMyIdentification(1L, 5L);
    }

    @Test
    void removeMyIdentification_whenNotOwned_propagatesEntityNotFoundException() {
        doThrow(new EntityNotFoundException("Identification with ID 99 not found for this employee"))
                .when(selfServiceHelper).removeMyIdentification(1L, 99L);

        assertThatThrownBy(() -> service.removeMyIdentification(1L, 99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── getMyProfile ──────────────────────────────────────────────────────────

    @Test
    void getMyProfile_delegatesToServiceHelper() {
        EmployeeDetailResult detail = new EmployeeDetailResult(
                1L, "John", "Doe", "john@test.com", CommonStatus.ACTIVE,
                null, null, null, null, null, List.of(), List.of(), null, null);
        when(serviceHelper.getEmployeeDetail(1L)).thenReturn(detail);

        EmployeeDetailResult result = service.getMyProfile(1L);

        assertThat(result).isEqualTo(detail);
        verify(serviceHelper).getEmployeeDetail(1L);
    }

    @Test
    void getMyProfile_whenEmployeeNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.getEmployeeDetail(99L))
                .thenThrow(new EntityNotFoundException("Employee with ID 99 not found"));

        assertThatThrownBy(() -> service.getMyProfile(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
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

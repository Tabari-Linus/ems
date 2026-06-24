package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.*;
import com.mrlii.ems.organization.employee.enums.IdentificationType;
import com.mrlii.ems.organization.employee.repository.*;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeSelfServiceHelperTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeBioRepository bioRepository;
    @Mock private EmployeeContactRepository contactRepository;
    @Mock private EmployeeAddressRepository addressRepository;
    @Mock private EmployeeIdentificationRepository identificationRepository;
    @Mock private EmployeeValidator validator;
    @InjectMocks private EmployeeSelfServiceHelper helper;

    // ── updateMyBio ───────────────────────────────────────────────────────────

    @Test
    void updateMyBio_whenNoBioExists_createsAndSavesBio() {
        Employee employee = buildEmployee(1L);
        EmployeeBioInput input = new EmployeeBioInput("John Doe", null, "Male", "Ghanaian", null, null, null, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(bioRepository.findByEmployee_Id(1L)).thenReturn(Optional.empty());

        helper.updateMyBio(1L, input);

        ArgumentCaptor<EmployeeBio> captor = ArgumentCaptor.forClass(EmployeeBio.class);
        verify(bioRepository).save(captor.capture());
        assertThat(captor.getValue().getFullName()).isEqualTo("John Doe");
        assertThat(captor.getValue().getGender()).isEqualTo("Male");
        assertThat(captor.getValue().getEmployee()).isEqualTo(employee);
    }

    @Test
    void updateMyBio_whenBioExists_updatesExistingBio() {
        Employee employee = buildEmployee(1L);
        EmployeeBio existing = EmployeeBio.builder().id(5L).employee(employee).gender("Female").build();
        EmployeeBioInput input = new EmployeeBioInput(null, null, "Male", null, null, null, null, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(bioRepository.findByEmployee_Id(1L)).thenReturn(Optional.of(existing));

        helper.updateMyBio(1L, input);

        verify(bioRepository).save(existing);
        assertThat(existing.getGender()).isEqualTo("Male");
    }

    @Test
    void updateMyBio_returnsEmployee() {
        Employee employee = buildEmployee(1L);
        EmployeeBioInput input = new EmployeeBioInput(null, null, null, null, null, null, null, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(bioRepository.findByEmployee_Id(1L)).thenReturn(Optional.empty());

        Employee result = helper.updateMyBio(1L, input);

        assertThat(result).isEqualTo(employee);
    }

    // ── updateMyContact ───────────────────────────────────────────────────────

    @Test
    void updateMyContact_whenNoContactExists_createsAndSavesContact() {
        Employee employee = buildEmployee(1L);
        EmployeeContactInput input = new EmployeeContactInput(Set.of("+233201234567"), Set.of("me@personal.com"));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(contactRepository.findByEmployee_Id(1L)).thenReturn(Optional.empty());

        helper.updateMyContact(1L, input);

        ArgumentCaptor<EmployeeContact> captor = ArgumentCaptor.forClass(EmployeeContact.class);
        verify(contactRepository).save(captor.capture());
        assertThat(captor.getValue().getPhoneNumbers()).contains("+233201234567");
        assertThat(captor.getValue().getEmployee()).isEqualTo(employee);
    }

    @Test
    void updateMyContact_whenContactExists_updatesPhoneAndEmail() {
        Employee employee = buildEmployee(1L);
        EmployeeContact existing = EmployeeContact.builder().id(3L).employee(employee)
                .phoneNumbers(Set.of("+233")).personalEmails(Set.of("old@mail.com")).build();
        EmployeeContactInput input = new EmployeeContactInput(Set.of("+233501234567"), Set.of("new@mail.com"));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(contactRepository.findByEmployee_Id(1L)).thenReturn(Optional.of(existing));

        helper.updateMyContact(1L, input);

        verify(contactRepository).save(existing);
        assertThat(existing.getPhoneNumbers()).containsOnly("+233501234567");
    }

    // ── addMyAddress ──────────────────────────────────────────────────────────

    @Test
    void addMyAddress_savesAddressLinkedToEmployee() {
        Employee employee = buildEmployee(1L);
        EmployeeAddressInput input = new EmployeeAddressInput("1 Main St", "Accra", null, null, "Ghana", null, false);
        EmployeeAddress saved = EmployeeAddress.builder().id(10L).city("Accra").country("Ghana").build();
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(addressRepository.save(any())).thenReturn(saved);

        EmployeeAddress result = helper.addMyAddress(1L, input);

        assertThat(result.getId()).isEqualTo(10L);
        verify(addressRepository).save(any(EmployeeAddress.class));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void addMyAddress_whenIsCurrentAddress_updatesEmployeeAddressReference() {
        Employee employee = buildEmployee(1L);
        EmployeeAddressInput input = new EmployeeAddressInput("1 Main St", "Accra", null, null, "Ghana", null, true);
        EmployeeAddress saved = EmployeeAddress.builder().id(10L).build();
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(addressRepository.save(any())).thenReturn(saved);

        helper.addMyAddress(1L, input);

        assertThat(employee.getAddress()).isEqualTo(saved);
        verify(employeeRepository).save(employee);
    }

    // ── updateMyAddress ───────────────────────────────────────────────────────

    @Test
    void updateMyAddress_updatesFieldsAndSaves() {
        Employee employee = buildEmployee(1L);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).employee(employee).city("Old City").build();
        EmployeeAddressInput input = new EmployeeAddressInput("2 New St", "Kumasi", null, null, "Ghana", null, false);
        when(addressRepository.findByIdAndEmployee_Id(10L, 1L)).thenReturn(Optional.of(address));
        when(addressRepository.save(any())).thenReturn(address);

        EmployeeAddress result = helper.updateMyAddress(1L, 10L, input);

        assertThat(address.getCity()).isEqualTo("Kumasi");
        assertThat(result).isEqualTo(address);
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void updateMyAddress_whenNotOwned_throwsEntityNotFoundException() {
        when(addressRepository.findByIdAndEmployee_Id(99L, 1L)).thenReturn(Optional.empty());
        EmployeeAddressInput input = new EmployeeAddressInput(null, null, null, null, null, null, false);
        assertThatThrownBy(() -> helper.updateMyAddress(1L, 99L, input))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateMyAddress_whenIsCurrentAddress_updatesEmployeeReference() {
        Employee employee = buildEmployee(1L);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).employee(employee).build();
        EmployeeAddressInput input = new EmployeeAddressInput(null, "Accra", null, null, "Ghana", null, true);
        when(addressRepository.findByIdAndEmployee_Id(10L, 1L)).thenReturn(Optional.of(address));
        when(addressRepository.save(any())).thenReturn(address);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        helper.updateMyAddress(1L, 10L, input);

        assertThat(employee.getAddress()).isEqualTo(address);
        verify(employeeRepository).save(employee);
    }

    // ── removeMyAddress ───────────────────────────────────────────────────────

    @Test
    void removeMyAddress_deletesAddress() {
        Employee employee = buildEmployee(1L);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).employee(employee).build();
        when(addressRepository.findByIdAndEmployee_Id(10L, 1L)).thenReturn(Optional.of(address));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        helper.removeMyAddress(1L, 10L);

        verify(addressRepository).delete(address);
    }

    @Test
    void removeMyAddress_whenIsCurrentAddress_clearsEmployeeReference() {
        Employee employee = buildEmployee(1L);
        EmployeeAddress address = EmployeeAddress.builder().id(10L).employee(employee).build();
        employee.setAddress(address);
        when(addressRepository.findByIdAndEmployee_Id(10L, 1L)).thenReturn(Optional.of(address));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        helper.removeMyAddress(1L, 10L);

        assertThat(employee.getAddress()).isNull();
        verify(employeeRepository).save(employee);
        verify(addressRepository).delete(address);
    }

    @Test
    void removeMyAddress_whenNotOwned_throwsEntityNotFoundException() {
        when(addressRepository.findByIdAndEmployee_Id(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> helper.removeMyAddress(1L, 99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── addMyIdentification ───────────────────────────────────────────────────

    @Test
    void addMyIdentification_savesAndLinksToEmployee() {
        Employee employee = buildEmployee(1L);
        EmployeeIdentificationInput input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        EmployeeIdentification saved = EmployeeIdentification.builder().id(5L).identificationNumber("GHA-001").build();
        when(identificationRepository.existsByIdentificationNumber("GHA-001")).thenReturn(false);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(identificationRepository.save(any())).thenReturn(saved);

        EmployeeIdentification result = helper.addMyIdentification(1L, input);

        assertThat(result.getId()).isEqualTo(5L);
        assertThat(employee.getIdentification()).isEqualTo(saved);
        verify(employeeRepository).save(employee);
    }

    @Test
    void addMyIdentification_whenDuplicateNumber_throwsDuplicateEntityException() {
        EmployeeIdentificationInput input = new EmployeeIdentificationInput("GHA-001", IdentificationType.PASSPORT);
        when(identificationRepository.existsByIdentificationNumber("GHA-001")).thenReturn(true);

        assertThatThrownBy(() -> helper.addMyIdentification(1L, input))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("GHA-001");
    }

    // ── removeMyIdentification ────────────────────────────────────────────────

    @Test
    void removeMyIdentification_deletesIdentification() {
        Employee employee = buildEmployee(1L);
        EmployeeIdentification identification = EmployeeIdentification.builder().id(5L).employee(employee).build();
        when(identificationRepository.findByIdAndEmployee_Id(5L, 1L)).thenReturn(Optional.of(identification));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        helper.removeMyIdentification(1L, 5L);

        verify(identificationRepository).delete(identification);
    }

    @Test
    void removeMyIdentification_whenIsCurrent_clearsEmployeeReference() {
        Employee employee = buildEmployee(1L);
        EmployeeIdentification identification = EmployeeIdentification.builder().id(5L).employee(employee).build();
        employee.setIdentification(identification);
        when(identificationRepository.findByIdAndEmployee_Id(5L, 1L)).thenReturn(Optional.of(identification));
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);

        helper.removeMyIdentification(1L, 5L);

        assertThat(employee.getIdentification()).isNull();
        verify(employeeRepository).save(employee);
        verify(identificationRepository).delete(identification);
    }

    @Test
    void removeMyIdentification_whenNotOwned_throwsEntityNotFoundException() {
        when(identificationRepository.findByIdAndEmployee_Id(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> helper.removeMyIdentification(1L, 99L))
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

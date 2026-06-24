package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.department.entity.Department;
import com.mrlii.ems.organization.department.repository.DepartmentRepository;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.entity.EmployeeAddress;
import com.mrlii.ems.organization.employee.entity.EmployeeBio;
import com.mrlii.ems.organization.employee.entity.EmployeeContact;
import com.mrlii.ems.organization.employee.enums.IdentificationType;
import com.mrlii.ems.organization.employee.repository.*;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeePersistenceHelperTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeBioRepository bioRepository;
    @Mock private EmployeeContactRepository contactRepository;
    @Mock private EmployeeAddressRepository addressRepository;
    @Mock private EmployeeIdentificationRepository identificationRepository;
    @Mock private PositionRepository positionRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private AccessLevelRepository accessLevelRepository;
    @Mock private EmployeeValidator validator;
    @Mock private CommonUtilHelper commonUtilHelper;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private EmployeePersistenceHelper persistenceHelper;

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_withBasicInput_savesEmployeeWithActiveStatus() {
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        Employee result = persistenceHelper.create(input);

        assertThat(result).isEqualTo(saved);
        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(CommonStatus.ACTIVE);
        verify(validator).validateEmailIsUnique("john@test.com");
    }

    @Test
    void create_withPositionId_resolvesAndSetsPosition() {
        Position position = Position.builder().id(10L).positionName("Engineer").level(PositionLevel.SENIOR).build();
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", 10L, null, null, null, null, null, null);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(employeeRepository.save(any())).thenReturn(buildEmployee(1L, "john@test.com"));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(captor.capture());
        assertThat(captor.getValue().getPosition()).isEqualTo(position);
    }

    @Test
    void create_withBioInput_savesBio() {
        EmployeeBioInput bioInput = new EmployeeBioInput("John Doe", null, "Male", null, null, null, null, null, null, null);
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, bioInput, null, null, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        ArgumentCaptor<EmployeeBio> bioCaptor = ArgumentCaptor.forClass(EmployeeBio.class);
        verify(bioRepository).save(bioCaptor.capture());
        assertThat(bioCaptor.getValue().getGender()).isEqualTo("Male");
        assertThat(bioCaptor.getValue().getEmployee()).isEqualTo(saved);
    }

    @Test
    void create_withContactInput_savesContact() {
        EmployeeContactInput contactInput = new EmployeeContactInput(Set.of("+233201234567"), Set.of("john@personal.com"));
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, contactInput, null, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        ArgumentCaptor<EmployeeContact> contactCaptor = ArgumentCaptor.forClass(EmployeeContact.class);
        verify(contactRepository).save(contactCaptor.capture());
        assertThat(contactCaptor.getValue().getPhoneNumbers()).contains("+233201234567");
    }

    @Test
    void create_withAddressInput_savesAddressAndLinksToEmployee() {
        EmployeeAddressInput addressInput = new EmployeeAddressInput("123 Main St", "Accra", null, null, "Ghana", null, true);
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, addressInput, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        EmployeeAddress savedAddress = EmployeeAddress.builder().id(5L).build();
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(addressRepository.save(any())).thenReturn(savedAddress);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        verify(addressRepository).save(any(EmployeeAddress.class));
        assertThat(saved.getAddress()).isEqualTo(savedAddress);
    }

    @Test
    void create_withDuplicateIdentificationNumber_throwsDuplicateEntityException() {
        EmployeeIdentificationInput idInput = new EmployeeIdentificationInput("GHA-1234", IdentificationType.PASSPORT);
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, idInput);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(buildEmployee(1L, "john@test.com"));
        when(identificationRepository.existsByIdentificationNumber("GHA-1234")).thenReturn(true);

        assertThatThrownBy(() -> persistenceHelper.create(input))
                .isInstanceOf(com.mrlii.ems.common.exception.DuplicateEntityException.class)
                .hasMessageContaining("GHA-1234");
    }

    @Test
    void create_withNullOptionalFields_skipsNestedPersistence() {
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, null);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(buildEmployee(1L, "john@test.com"));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        verify(bioRepository, never()).save(any());
        verify(contactRepository, never()).save(any());
        verify(addressRepository, never()).save(any());
        verify(identificationRepository, never()).save(any());
    }

    @Test
    void create_alwaysCreatesLinkedUserAccount() {
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp");

        persistenceHelper.create(input);

        ArgumentCaptor<UserAccount> captor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("john@test.com");
        assertThat(captor.getValue().isEnabled()).isTrue();
        assertThat(captor.getValue().getEmployee()).isEqualTo(saved);
    }

    @Test
    void create_userAccount_passwordIsEncoded() {
        CreateEmployeeInput input = new CreateEmployeeInput(
                "John", "Doe", "john@test.com", null, null, null, null, null, null, null);
        Employee saved = buildEmployee(1L, "john@test.com");
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any())).thenReturn(saved);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashed");

        persistenceHelper.create(input);

        ArgumentCaptor<UserAccount> captor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("$2a$10$hashed");
        verify(passwordEncoder).encode(anyString());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_withNewFirstName_updatesFirstName() {
        Employee existing = buildEmployee(1L, "john@test.com");
        UpdateEmployeeInput input = new UpdateEmployeeInput("Jane", null, null, null, null, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(commonUtilHelper.normalizeName("Jane")).thenReturn("Jane");
        when(employeeRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        assertThat(existing.getFirstName()).isEqualTo("Jane");
    }

    @Test
    void update_withNewEmail_validatesUniquenessAndUpdates() {
        Employee existing = buildEmployee(1L, "old@test.com");
        UpdateEmployeeInput input = new UpdateEmployeeInput(null, null, "new@test.com", null, null, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(employeeRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        verify(validator).validateEmailIsUniqueForUpdate(1L, "new@test.com");
        assertThat(existing.getWorkEmail()).isEqualTo("new@test.com");
    }

    @Test
    void update_withNewDepartment_resolvesAndSetsDepartment() {
        Employee existing = buildEmployee(1L, "john@test.com");
        Department dept = Department.builder().id(7L).departmentName("Engineering").build();
        UpdateEmployeeInput input = new UpdateEmployeeInput(null, null, null, null, 7L, null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(departmentRepository.findById(7L)).thenReturn(Optional.of(dept));
        when(employeeRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        assertThat(existing.getDepartment()).isEqualTo(dept);
    }

    @Test
    void update_withBioInput_createsOrUpdatesBio() {
        Employee existing = buildEmployee(1L, "john@test.com");
        EmployeeBioInput bioInput = new EmployeeBioInput(null, null, "Female", null, null, null, null, null, null, null);
        UpdateEmployeeInput input = new UpdateEmployeeInput(null, null, null, null, null, null, bioInput, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(employeeRepository.save(any())).thenReturn(existing);
        when(bioRepository.findByEmployee_Id(1L)).thenReturn(Optional.empty());

        persistenceHelper.update(1L, input);

        ArgumentCaptor<EmployeeBio> captor = ArgumentCaptor.forClass(EmployeeBio.class);
        verify(bioRepository).save(captor.capture());
        assertThat(captor.getValue().getGender()).isEqualTo("Female");
    }

    // ── status transitions ────────────────────────────────────────────────────

    @Test
    void activate_setsStatusToActive() {
        Employee employee = buildEmployee(1L, "john@test.com");
        employee.setStatus(CommonStatus.ARCHIVED);
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(employeeRepository.save(any())).thenReturn(employee);

        Employee result = persistenceHelper.activate(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ACTIVE);
    }

    @Test
    void archive_setsStatusToArchived() {
        Employee employee = buildEmployee(1L, "john@test.com");
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(employeeRepository.save(any())).thenReturn(employee);

        Employee result = persistenceHelper.archive(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
    }

    @Test
    void softDelete_setsArchivedStatusAndDeletedAt() {
        Employee employee = buildEmployee(1L, "john@test.com");
        LocalDateTime now = LocalDateTime.now();
        when(validator.findByIdOrThrow(1L)).thenReturn(employee);
        when(commonUtilHelper.getCurrentDateTime()).thenReturn(now);

        persistenceHelper.softDelete(1L);

        assertThat(employee.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
        assertThat(employee.getDeletedAt()).isEqualTo(now);
        verify(employeeRepository).save(employee);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

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

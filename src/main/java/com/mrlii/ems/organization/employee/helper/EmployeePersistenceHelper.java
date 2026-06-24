package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.department.entity.Department;
import com.mrlii.ems.organization.department.repository.DepartmentRepository;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.*;
import com.mrlii.ems.organization.employee.repository.*;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeePersistenceHelper {

    private final EmployeeRepository employeeRepository;
    private final EmployeeBioRepository bioRepository;
    private final EmployeeContactRepository contactRepository;
    private final EmployeeAddressRepository addressRepository;
    private final EmployeeIdentificationRepository identificationRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final AccessLevelRepository accessLevelRepository;
    private final EmployeeValidator validator;
    private final CommonUtilHelper commonUtilHelper;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public Employee create(CreateEmployeeInput input) {
        validator.validateEmailIsUnique(input.workEmail());

        Employee employee = Employee.builder()
                .firstName(commonUtilHelper.normalizeName(input.firstName()))
                .lastName(commonUtilHelper.normalizeName(input.lastName()))
                .workEmail(input.workEmail().toLowerCase())
                .status(CommonStatus.ACTIVE)
                .position(resolvePosition(input.positionId()))
                .department(resolveDepartment(input.departmentId()))
                .accessLevel(resolveAccessLevel(input.accessLevelId()))
                .build();

        Employee saved = employeeRepository.save(employee);

        persistBio(input.bio(), saved);
        persistContact(input.contact(), saved);
        persistAddress(input.address(), saved);
        persistIdentification(input.identification(), saved);
        createUserAccount(saved);

        return saved;
    }

    private String generateTemporaryPassword() {
        // DO: deliver via email when notification service is implemented
        String raw = UUID.randomUUID().toString().replace("-", "");
        log.info("Temporary password for new employee account: {}", raw);
        return raw;
    }

    private void createUserAccount(Employee employee) {
        String raw = generateTemporaryPassword();
        UserAccount account = UserAccount.builder()
                .email(employee.getWorkEmail())
                .passwordHash(passwordEncoder.encode(raw))
                .employee(employee)
                .build();
        userAccountRepository.save(account);
        log.info("UserAccount provisioned for employee id={}, email={}", employee.getId(), employee.getWorkEmail());
    }

    public Employee update(Long id, UpdateEmployeeInput input) {
        Employee employee = validator.findByIdOrThrow(id);

        if (input.firstName() != null && !input.firstName().isBlank()) {
            employee.setFirstName(commonUtilHelper.normalizeName(input.firstName()));
        }
        if (input.lastName() != null && !input.lastName().isBlank()) {
            employee.setLastName(commonUtilHelper.normalizeName(input.lastName()));
        }
        if (input.workEmail() != null && !input.workEmail().isBlank()) {
            validator.validateEmailIsUniqueForUpdate(id, input.workEmail());
            employee.setWorkEmail(input.workEmail().toLowerCase());
        }
        if (input.positionId() != null) {
            employee.setPosition(resolvePosition(input.positionId()));
        }
        if (input.departmentId() != null) {
            employee.setDepartment(resolveDepartment(input.departmentId()));
        }
        if (input.accessLevelId() != null) {
            employee.setAccessLevel(resolveAccessLevel(input.accessLevelId()));
        }

        Employee saved = employeeRepository.save(employee);

        updateBio(input.bio(), saved);
        updateContact(input.contact(), saved);

        return saved;
    }

    public Employee activate(Long id) {
        Employee employee = validator.findByIdOrThrow(id);
        employee.setStatus(CommonStatus.ACTIVE);
        return employeeRepository.save(employee);
    }

    public Employee archive(Long id) {
        Employee employee = validator.findByIdOrThrow(id);
        employee.setStatus(CommonStatus.ARCHIVED);
        return employeeRepository.save(employee);
    }

    public void softDelete(Long id) {
        Employee employee = validator.findByIdOrThrow(id);
        employee.setStatus(CommonStatus.ARCHIVED);
        employee.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        employeeRepository.save(employee);
    }

    private void persistBio(EmployeeBioInput input, Employee employee) {
        if (input == null) return;
        EmployeeBio bio = EmployeeBio.builder()
                .employee(employee)
                .fullName(input.fullName())
                .otherName(input.otherName())
                .gender(input.gender())
                .nationality(input.nationality())
                .maritalStatus(input.maritalStatus())
                .dateOfBirth(input.dateOfBirth())
                .placeOfBirth(input.placeOfBirth())
                .profilePicture(input.profilePicture())
                .isExpert(input.isExpert())
                .build();
        bioRepository.save(bio);
    }

    private void persistContact(EmployeeContactInput input, Employee employee) {
        if (input == null) return;
        EmployeeContact contact = EmployeeContact.builder()
                .employee(employee)
                .phoneNumbers(input.phoneNumbers())
                .personalEmails(input.personalEmails())
                .build();
        contactRepository.save(contact);
    }

    private void persistAddress(EmployeeAddressInput input, Employee employee) {
        if (input == null) return;
        EmployeeAddress address = EmployeeAddress.builder()
                .employee(employee)
                .street(input.street())
                .city(input.city())
                .state(input.state())
                .zipCode(input.zipCode())
                .country(input.country())
                .digitalAddress(input.digitalAddress())
                .isCurrentAddress(Boolean.TRUE.equals(input.isCurrentAddress()))
                .build();
        EmployeeAddress saved = addressRepository.save(address);
        employee.setAddress(saved);
        employeeRepository.save(employee);
    }

    private void persistIdentification(EmployeeIdentificationInput input, Employee employee) {
        if (input == null) return;
        if (identificationRepository.existsByIdentificationNumber(input.identificationNumber())) {
            throw new DuplicateEntityException(
                    "Identification number '%s' is already registered".formatted(input.identificationNumber()));
        }
        EmployeeIdentification identification = EmployeeIdentification.builder()
                .employee(employee)
                .identificationNumber(input.identificationNumber())
                .identificationType(input.identificationType())
                .build();
        EmployeeIdentification saved = identificationRepository.save(identification);
        employee.setIdentification(saved);
        employeeRepository.save(employee);
    }

    private void updateBio(EmployeeBioInput input, Employee employee) {
        if (input == null) return;
        EmployeeBio bio = bioRepository.findByEmployee_Id(employee.getId())
                .orElse(EmployeeBio.builder().employee(employee).build());
        bio.setFullName(input.fullName());
        bio.setOtherName(input.otherName());
        bio.setGender(input.gender());
        bio.setNationality(input.nationality());
        bio.setMaritalStatus(input.maritalStatus());
        bio.setDateOfBirth(input.dateOfBirth());
        bio.setPlaceOfBirth(input.placeOfBirth());
        bio.setProfilePicture(input.profilePicture());
        bio.setIsExpert(input.isExpert());
        bioRepository.save(bio);
    }

    private void updateContact(EmployeeContactInput input, Employee employee) {
        if (input == null) return;
        EmployeeContact contact = contactRepository.findByEmployee_Id(employee.getId())
                .orElse(EmployeeContact.builder().employee(employee).build());
        contact.setPhoneNumbers(input.phoneNumbers());
        contact.setPersonalEmails(input.personalEmails());
        contactRepository.save(contact);
    }

    private Position resolvePosition(Long positionId) {
        if (positionId == null) return null;
        return positionRepository.findById(positionId)
                .orElseThrow(() -> new EntityNotFoundException("Position with ID %d not found".formatted(positionId)));
    }

    private Department resolveDepartment(Long departmentId) {
        if (departmentId == null) return null;
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department with ID %d not found".formatted(departmentId)));
    }

    private AccessLevel resolveAccessLevel(Long accessLevelId) {
        if (accessLevelId == null) return null;
        return accessLevelRepository.findById(accessLevelId)
                .orElseThrow(() -> new EntityNotFoundException("Access level with ID %d not found".formatted(accessLevelId)));
    }
}

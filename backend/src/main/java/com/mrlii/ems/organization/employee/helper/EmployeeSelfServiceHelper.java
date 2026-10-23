package com.mrlii.ems.organization.employee.helper;

import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.*;
import com.mrlii.ems.organization.employee.repository.*;
import com.mrlii.ems.organization.employee.util.EmployeeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class EmployeeSelfServiceHelper {

    private final EmployeeRepository employeeRepository;
    private final EmployeeBioRepository bioRepository;
    private final EmployeeContactRepository contactRepository;
    private final EmployeeAddressRepository addressRepository;
    private final EmployeeIdentificationRepository identificationRepository;
    private final EmployeeValidator validator;

    public Employee updateMyBio(Long employeeId, EmployeeBioInput input) {
        Employee employee = validator.findByIdOrThrow(employeeId);
        EmployeeBio bio = bioRepository.findByEmployee_Id(employeeId)
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
        return employee;
    }

    public Employee updateMyContact(Long employeeId, EmployeeContactInput input) {
        Employee employee = validator.findByIdOrThrow(employeeId);
        EmployeeContact contact = contactRepository.findByEmployee_Id(employeeId)
                .orElse(EmployeeContact.builder().employee(employee).build());
        contact.setPhoneNumbers(input.phoneNumbers());
        contact.setPersonalEmails(input.personalEmails());
        contactRepository.save(contact);
        return employee;
    }

    public EmployeeAddress addMyAddress(Long employeeId, EmployeeAddressInput input) {
        Employee employee = validator.findByIdOrThrow(employeeId);
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
        if (Boolean.TRUE.equals(input.isCurrentAddress())) {
            employee.setAddress(saved);
            employeeRepository.save(employee);
        }
        return saved;
    }

    public EmployeeAddress updateMyAddress(Long employeeId, Long addressId, EmployeeAddressInput input) {
        EmployeeAddress address = addressRepository.findByIdAndEmployee_Id(addressId, employeeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Address with ID %d not found for this employee".formatted(addressId)));
        address.setStreet(input.street());
        address.setCity(input.city());
        address.setState(input.state());
        address.setZipCode(input.zipCode());
        address.setCountry(input.country());
        address.setDigitalAddress(input.digitalAddress());
        address.setIsCurrentAddress(Boolean.TRUE.equals(input.isCurrentAddress()));
        EmployeeAddress saved = addressRepository.save(address);
        if (Boolean.TRUE.equals(input.isCurrentAddress())) {
            Employee employee = validator.findByIdOrThrow(employeeId);
            employee.setAddress(saved);
            employeeRepository.save(employee);
        }
        return saved;
    }

    @Transactional
    public void removeMyAddress(Long employeeId, Long addressId) {
        EmployeeAddress address = addressRepository.findByIdAndEmployee_Id(addressId, employeeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Address with ID %d not found for this employee".formatted(addressId)));
        Employee employee = validator.findByIdOrThrow(employeeId);
        if (employee.getAddress() != null && employee.getAddress().getId().equals(addressId)) {
            employee.setAddress(null);
            employeeRepository.save(employee);
        }
        addressRepository.delete(address);
    }

    public EmployeeIdentification addMyIdentification(Long employeeId, EmployeeIdentificationInput input) {
        if (identificationRepository.existsByIdentificationNumber(input.identificationNumber())) {
            throw new DuplicateEntityException(
                    "Identification number '%s' is already registered".formatted(input.identificationNumber()));
        }
        Employee employee = validator.findByIdOrThrow(employeeId);
        EmployeeIdentification identification = EmployeeIdentification.builder()
                .employee(employee)
                .identificationNumber(input.identificationNumber())
                .identificationType(input.identificationType())
                .build();
        EmployeeIdentification saved = identificationRepository.save(identification);
        employee.setIdentification(saved);
        employeeRepository.save(employee);
        return saved;
    }

    @Transactional
    public void removeMyIdentification(Long employeeId, Long identificationId) {
        EmployeeIdentification identification = identificationRepository.findByIdAndEmployee_Id(identificationId, employeeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Identification with ID %d not found for this employee".formatted(identificationId)));
        Employee employee = validator.findByIdOrThrow(employeeId);
        if (employee.getIdentification() != null && employee.getIdentification().getId().equals(identificationId)) {
            employee.setIdentification(null);
            employeeRepository.save(employee);
        }
        identificationRepository.delete(identification);
    }
}

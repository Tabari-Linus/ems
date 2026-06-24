package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.EmployeeIdentification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeIdentificationRepository extends JpaRepository<EmployeeIdentification, Long> {

    List<EmployeeIdentification> findAllByEmployee_Id(Long employeeId);

    boolean existsByIdentificationNumber(String identificationNumber);

    boolean existsByIdentificationNumberAndIdNot(String identificationNumber, Long id);

    Optional<EmployeeIdentification> findByIdAndEmployee_Id(Long id, Long employeeId);
}

package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.EmployeeAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeAddressRepository extends JpaRepository<EmployeeAddress, Long> {

    List<EmployeeAddress> findAllByEmployee_Id(Long employeeId);

    Optional<EmployeeAddress> findByIdAndEmployee_Id(Long id, Long employeeId);
}

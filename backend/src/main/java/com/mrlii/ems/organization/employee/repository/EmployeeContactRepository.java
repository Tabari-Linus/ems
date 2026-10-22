package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.EmployeeContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeContactRepository extends JpaRepository<EmployeeContact, Long> {

    Optional<EmployeeContact> findByEmployee_Id(Long employeeId);
}

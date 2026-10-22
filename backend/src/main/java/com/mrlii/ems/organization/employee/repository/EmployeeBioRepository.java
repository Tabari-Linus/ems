package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.EmployeeBio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeBioRepository extends JpaRepository<EmployeeBio, Long> {

    Optional<EmployeeBio> findByEmployee_Id(Long employeeId);
}

package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}

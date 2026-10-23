package com.mrlii.ems.organization.employee.repository;

import com.mrlii.ems.organization.employee.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    boolean existsByWorkEmailIgnoreCase(String workEmail);

    boolean existsByWorkEmailIgnoreCaseAndIdNot(String workEmail, Long id);

    @EntityGraph(attributePaths = {"bio", "contact", "address", "identification", "position", "department", "accessLevel"})
    Optional<Employee> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"position", "department"})
    Page<Employee> findAll(Specification<Employee> spec, Pageable pageable);
}

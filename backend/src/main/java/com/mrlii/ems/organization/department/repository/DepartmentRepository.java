package com.mrlii.ems.organization.department.repository;

import com.mrlii.ems.organization.department.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    boolean existsByDepartmentNameIgnoreCase(String departmentName);

    boolean existsByDepartmentCodeIgnoreCase(String departmentCode);

    boolean existsByDepartmentEmailIgnoreCase(String departmentEmail);

    Page<Department> findAll(Specification<Department> spec, Pageable pageable);
}

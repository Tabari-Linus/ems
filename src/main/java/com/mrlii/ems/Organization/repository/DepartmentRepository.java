package com.mrlii.ems.Organization.repository;

import com.mrlii.ems.Organization.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}

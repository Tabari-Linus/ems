package com.mrlii.ems.Organization.repository;

import com.mrlii.ems.Organization.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}

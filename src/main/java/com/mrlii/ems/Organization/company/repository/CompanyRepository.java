package com.mrlii.ems.Organization.company.repository;

import com.mrlii.ems.Organization.company.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByCompanyNameIgnoreCase(String companyName);

    boolean existsByCompanyCodeIgnoreCase(String companyCode);

    boolean existsByCompanyEmailIgnoreCase(String companyEmail);

    Page<Company> findAll(Specification<Company> spec, Pageable pageable);
}

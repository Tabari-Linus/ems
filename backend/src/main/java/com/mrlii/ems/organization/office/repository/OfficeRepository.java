package com.mrlii.ems.organization.office.repository;

import com.mrlii.ems.organization.office.entity.Office;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficeRepository extends JpaRepository<Office, Long> {

    boolean existsByOfficeNameIgnoreCase(String officeName);

    boolean existsByOfficeCodeIgnoreCase(String officeCode);

    boolean existsByOfficeEmailIgnoreCase(String officeEmail);

    Page<Office> findAll(Specification<Office> spec, Pageable pageable);
}

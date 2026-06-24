package com.mrlii.ems.accesslevel.repository;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccessLevelRepository extends JpaRepository<AccessLevel, Long> {

    boolean existsByAccessLevelNameIgnoreCase(String accessLevelName);

    Optional<AccessLevel> findByAccessLevelNameIgnoreCase(String name);

    boolean existsByAccessLevelNameIgnoreCaseAndIdNot(String accessLevelName, Long id);

    @EntityGraph(attributePaths = {"permissions", "employees"})
    Optional<AccessLevel> findByIdAndDeletedAtIsNull(Long id);

    Page<AccessLevel> findAll(Specification<AccessLevel> spec, Pageable pageable);
}

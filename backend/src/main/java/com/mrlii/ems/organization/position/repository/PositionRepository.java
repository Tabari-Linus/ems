package com.mrlii.ems.organization.position.repository;

import com.mrlii.ems.organization.position.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long>, JpaSpecificationExecutor<Position> {

    boolean existsByPositionNameIgnoreCase(String positionName);

    boolean existsByPositionNameIgnoreCaseAndIdNot(String positionName, Long id);

    Optional<Position> findByIdAndDeletedAtIsNull(Long id);
}

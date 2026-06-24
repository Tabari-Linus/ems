package com.mrlii.ems.organization.position.util;

import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PositionValidator {

    private final PositionRepository positionRepository;

    public void validateNameIsUnique(String name) {
        if (positionRepository.existsByPositionNameIgnoreCase(name)) {
            throw new DuplicateEntityException(
                    "A position with the name '%s' already exists".formatted(name));
        }
    }

    public void validateNameIsUniqueForUpdate(Long id, String name) {
        if (positionRepository.existsByPositionNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateEntityException(
                    "A position with the name '%s' already exists".formatted(name));
        }
    }

    public Position findByIdOrThrow(Long id) {
        return positionRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Position with ID %d not found".formatted(id)));
    }
}

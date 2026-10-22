package com.mrlii.ems.organization.position.util;

import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PositionValidatorTest {

    @Mock private PositionRepository positionRepository;
    @InjectMocks private PositionValidator validator;

    @Test
    void validateNameIsUnique_whenNameNotTaken_doesNotThrow() {
        when(positionRepository.existsByPositionNameIgnoreCase("Engineer")).thenReturn(false);

        validator.validateNameIsUnique("Engineer");
    }

    @Test
    void validateNameIsUnique_whenNameAlreadyExists_throwsDuplicateEntityException() {
        when(positionRepository.existsByPositionNameIgnoreCase("Engineer")).thenReturn(true);

        assertThatThrownBy(() -> validator.validateNameIsUnique("Engineer"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("Engineer");
    }

    @Test
    void validateNameIsUniqueForUpdate_whenNameNotTakenByOther_doesNotThrow() {
        when(positionRepository.existsByPositionNameIgnoreCaseAndIdNot("Engineer", 1L)).thenReturn(false);

        validator.validateNameIsUniqueForUpdate(1L, "Engineer");
    }

    @Test
    void validateNameIsUniqueForUpdate_whenNameTakenByOther_throwsDuplicateEntityException() {
        when(positionRepository.existsByPositionNameIgnoreCaseAndIdNot("Engineer", 1L)).thenReturn(true);

        assertThatThrownBy(() -> validator.validateNameIsUniqueForUpdate(1L, "Engineer"))
                .isInstanceOf(DuplicateEntityException.class)
                .hasMessageContaining("Engineer");
    }

    @Test
    void findByIdOrThrow_whenPositionExists_returnsPosition() {
        Position position = buildPosition(1L, "Engineer");
        when(positionRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(position));

        Position result = validator.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(position);
    }

    @Test
    void findByIdOrThrow_whenPositionNotFound_throwsEntityNotFoundException() {
        when(positionRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> validator.findByIdOrThrow(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    private Position buildPosition(Long id, String name) {
        return Position.builder()
                .id(id)
                .positionName(name)
                .level(PositionLevel.SENIOR)
                .build();
    }
}

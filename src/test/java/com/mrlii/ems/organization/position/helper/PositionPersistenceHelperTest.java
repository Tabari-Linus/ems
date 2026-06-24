package com.mrlii.ems.organization.position.helper;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.position.dto.CreatePositionInput;
import com.mrlii.ems.organization.position.dto.UpdatePositionInput;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import com.mrlii.ems.organization.position.util.PositionValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PositionPersistenceHelperTest {

    @Mock private PositionRepository positionRepository;
    @Mock private PositionValidator validator;
    @Mock private CommonUtilHelper commonUtilHelper;
    @InjectMocks private PositionPersistenceHelper persistenceHelper;

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_withValidInput_savesPositionWithActiveStatus() {
        CreatePositionInput input = new CreatePositionInput("Software Engineer", PositionLevel.SENIOR, "Senior dev");
        Position saved = buildPosition(1L, "Software Engineer", PositionLevel.SENIOR);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(positionRepository.save(any())).thenReturn(saved);

        Position result = persistenceHelper.create(input);

        assertThat(result).isEqualTo(saved);
        ArgumentCaptor<Position> captor = ArgumentCaptor.forClass(Position.class);
        verify(positionRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(CommonStatus.ACTIVE);
        assertThat(captor.getValue().getLevel()).isEqualTo(PositionLevel.SENIOR);
        verify(validator).validateNameIsUnique("Software Engineer");
    }

    @Test
    void create_withNullDescription_savesPositionWithNullDescription() {
        CreatePositionInput input = new CreatePositionInput("Intern", PositionLevel.INTERN, null);
        Position saved = buildPosition(1L, "Intern", PositionLevel.INTERN);
        when(commonUtilHelper.normalizeName(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(positionRepository.save(any())).thenReturn(saved);

        persistenceHelper.create(input);

        ArgumentCaptor<Position> captor = ArgumentCaptor.forClass(Position.class);
        verify(positionRepository).save(captor.capture());
        assertThat(captor.getValue().getDescription()).isNull();
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_withNewName_validatesUniquenessAndUpdatesName() {
        Position existing = buildPosition(1L, "OldName", PositionLevel.JUNIOR);
        UpdatePositionInput input = new UpdatePositionInput("NewName", null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(commonUtilHelper.normalizeName("NewName")).thenReturn("NewName");
        when(positionRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        verify(validator).validateNameIsUniqueForUpdate(1L, "NewName");
        assertThat(existing.getPositionName()).isEqualTo("NewName");
    }

    @Test
    void update_withNewLevel_updatesLevel() {
        Position existing = buildPosition(1L, "Engineer", PositionLevel.JUNIOR);
        UpdatePositionInput input = new UpdatePositionInput(null, PositionLevel.SENIOR, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(positionRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        assertThat(existing.getLevel()).isEqualTo(PositionLevel.SENIOR);
    }

    @Test
    void update_withNullFields_skipsUpdates() {
        Position existing = buildPosition(1L, "Engineer", PositionLevel.SENIOR);
        existing.setDescription("Original desc");
        UpdatePositionInput input = new UpdatePositionInput(null, null, null);
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(positionRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        assertThat(existing.getPositionName()).isEqualTo("Engineer");
        assertThat(existing.getLevel()).isEqualTo(PositionLevel.SENIOR);
        assertThat(existing.getDescription()).isEqualTo("Original desc");
    }

    @Test
    void update_withNewDescription_updatesDescription() {
        Position existing = buildPosition(1L, "Engineer", PositionLevel.MID);
        UpdatePositionInput input = new UpdatePositionInput(null, null, "Updated desc");
        when(validator.findByIdOrThrow(1L)).thenReturn(existing);
        when(positionRepository.save(any())).thenReturn(existing);

        persistenceHelper.update(1L, input);

        assertThat(existing.getDescription()).isEqualTo("Updated desc");
    }

    // ── status transitions ────────────────────────────────────────────────────

    @Test
    void activate_setsStatusToActive() {
        Position position = buildPosition(1L, "Engineer", PositionLevel.SENIOR);
        position.setStatus(CommonStatus.ARCHIVED);
        when(validator.findByIdOrThrow(1L)).thenReturn(position);
        when(positionRepository.save(any())).thenReturn(position);

        Position result = persistenceHelper.activate(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ACTIVE);
        verify(positionRepository).save(position);
    }

    @Test
    void archive_setsStatusToArchived() {
        Position position = buildPosition(1L, "Engineer", PositionLevel.SENIOR);
        position.setStatus(CommonStatus.ACTIVE);
        when(validator.findByIdOrThrow(1L)).thenReturn(position);
        when(positionRepository.save(any())).thenReturn(position);

        Position result = persistenceHelper.archive(1L);

        assertThat(result.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
    }

    @Test
    void softDelete_setsArchivedStatusAndDeletedAt() {
        Position position = buildPosition(1L, "Engineer", PositionLevel.SENIOR);
        LocalDateTime now = LocalDateTime.now();
        when(validator.findByIdOrThrow(1L)).thenReturn(position);
        when(commonUtilHelper.getCurrentDateTime()).thenReturn(now);

        persistenceHelper.softDelete(1L);

        assertThat(position.getStatus()).isEqualTo(CommonStatus.ARCHIVED);
        assertThat(position.getDeletedAt()).isEqualTo(now);
        verify(positionRepository).save(position);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Position buildPosition(Long id, String name, PositionLevel level) {
        return Position.builder()
                .id(id)
                .positionName(name)
                .level(level)
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

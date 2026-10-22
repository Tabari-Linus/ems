package com.mrlii.ems.organization.position.service;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.position.dto.CreatePositionInput;
import com.mrlii.ems.organization.position.dto.PositionDetailResult;
import com.mrlii.ems.organization.position.dto.PositionFilterInput;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;
import com.mrlii.ems.organization.position.dto.UpdatePositionInput;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import com.mrlii.ems.organization.position.helper.PositionPersistenceHelper;
import com.mrlii.ems.organization.position.helper.PositionServiceHelper;
import com.mrlii.ems.organization.position.service.impl.PositionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PositionServiceImplTest {

    @Mock private PositionPersistenceHelper persistenceHelper;
    @Mock private PositionServiceHelper serviceHelper;
    @InjectMocks private PositionServiceImpl service;

    // ── mutations ─────────────────────────────────────────────────────────────

    @Test
    void createPosition_success_returnsActionResult() {
        CreatePositionInput input = new CreatePositionInput("Software Engineer", PositionLevel.SENIOR, "Senior dev");
        when(persistenceHelper.create(input)).thenReturn(buildPosition(1L, "Software Engineer"));

        ActionResult result = service.createPosition(input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Software Engineer");
    }

    @Test
    void updatePosition_success_returnsActionResult() {
        UpdatePositionInput input = new UpdatePositionInput("Lead Engineer", PositionLevel.LEAD, null);
        when(persistenceHelper.update(1L, input)).thenReturn(buildPosition(1L, "Lead Engineer"));

        ActionResult result = service.updatePosition(1L, input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Lead Engineer");
    }

    @Test
    void activatePosition_success_returnsActionResult() {
        when(persistenceHelper.activate(1L)).thenReturn(buildPosition(1L, "Engineer"));

        ActionResult result = service.activatePosition(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).activate(1L);
    }

    @Test
    void archivePosition_success_returnsActionResult() {
        when(persistenceHelper.archive(1L)).thenReturn(buildPosition(1L, "Engineer"));

        ActionResult result = service.archivePosition(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).archive(1L);
    }

    @Test
    void deletePosition_success_returnsActionResult() {
        Position position = buildPosition(1L, "Engineer");
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(position);

        ActionResult result = service.deletePosition(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Engineer");
        verify(persistenceHelper).softDelete(1L);
    }

    @Test
    void deletePosition_whenNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.findByIdOrThrow(99L))
                .thenThrow(new EntityNotFoundException("Position with ID 99 not found"));

        assertThatThrownBy(() -> service.deletePosition(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── queries ───────────────────────────────────────────────────────────────

    @Test
    void getPosition_success_returnsDetailResult() {
        Position position = buildPosition(1L, "Software Engineer");
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(position);

        PositionDetailResult result = service.getPosition(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.positionName()).isEqualTo("Software Engineer");
        assertThat(result.status()).isEqualTo(CommonStatus.ACTIVE);
        assertThat(result.level()).isEqualTo(PositionLevel.SENIOR);
    }

    @Test
    void getPosition_whenNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.findByIdOrThrow(99L))
                .thenThrow(new EntityNotFoundException("Position with ID 99 not found"));

        assertThatThrownBy(() -> service.getPosition(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getPositions_success_returnsPageResult() {
        PageResult<PositionListItemResult> expected = new PageResult<>(0, 0, 0, 20, false, false, List.of());
        when(serviceHelper.getPositions(any(), any(), any())).thenReturn(expected);

        PageResult<PositionListItemResult> result = service.getPositions(
                new PageInput(0, 20), null, null);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getPositions_withFilter_delegatesToServiceHelper() {
        PositionFilterInput filter = new PositionFilterInput(CommonStatus.ACTIVE, PositionLevel.SENIOR, "engineer");
        PageResult<PositionListItemResult> expected = new PageResult<>(0, 1, 1, 20, false, false, List.of());
        when(serviceHelper.getPositions(filter, null, null)).thenReturn(expected);

        PageResult<PositionListItemResult> result = service.getPositions(null, null, filter);

        assertThat(result).isEqualTo(expected);
        verify(serviceHelper).getPositions(filter, null, null);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Position buildPosition(Long id, String name) {
        return Position.builder()
                .id(id)
                .positionName(name)
                .level(PositionLevel.SENIOR)
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

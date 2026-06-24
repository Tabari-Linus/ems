package com.mrlii.ems.organization.position.helper;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.position.dto.PositionFilterInput;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import com.mrlii.ems.organization.position.util.PositionValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PositionServiceHelperTest {

    @Mock private PositionRepository positionRepository;
    @Mock private PositionValidator validator;
    @Mock private PaginationHelper paginationHelper;
    @InjectMocks private PositionServiceHelper serviceHelper;

    @Test
    void findByIdOrThrow_delegatesToValidator() {
        Position position = buildPosition(1L, "Engineer");
        when(validator.findByIdOrThrow(1L)).thenReturn(position);

        Position result = serviceHelper.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(position);
        verify(validator).findByIdOrThrow(1L);
    }

    @Test
    void getPositions_withNullFilter_returnsPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Position> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(positionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<PositionListItemResult> result = serviceHelper.getPositions(null, null, null);

        assertThat(result).isNotNull();
        assertThat(result.data()).isEmpty();
    }

    @Test
    void getPositions_withStatusFilter_returnsFilteredPage() {
        PositionFilterInput filter = new PositionFilterInput(CommonStatus.ACTIVE, null, null);
        Pageable pageable = PageRequest.of(0, 20);
        Position position = buildPosition(1L, "Engineer");
        Page<Position> page = new PageImpl<>(List.of(position));
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(positionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<PositionListItemResult> result = serviceHelper.getPositions(filter, new PageInput(0, 20), null);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).positionName()).isEqualTo("Engineer");
    }

    @Test
    void getPositions_withLevelFilter_returnsFilteredPage() {
        PositionFilterInput filter = new PositionFilterInput(null, PositionLevel.SENIOR, null);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Position> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(positionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<PositionListItemResult> result = serviceHelper.getPositions(filter, null, null);

        assertThat(result).isNotNull();
        verify(positionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getPositions_withSearchFilter_returnsFilteredPage() {
        PositionFilterInput filter = new PositionFilterInput(null, null, "engineer");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Position> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(positionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<PositionListItemResult> result = serviceHelper.getPositions(filter, null, null);

        assertThat(result).isNotNull();
        verify(positionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getPositions_withAllFilters_buildsFullSpecification() {
        PositionFilterInput filter = new PositionFilterInput(CommonStatus.ACTIVE, PositionLevel.SENIOR, "engineer");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Position> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(positionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        serviceHelper.getPositions(filter, new PageInput(0, 10), new SortInput("positionName", null));

        verify(paginationHelper).buildPageable(any(), any());
        verify(positionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    private Position buildPosition(Long id, String name) {
        return Position.builder()
                .id(id)
                .positionName(name)
                .level(PositionLevel.SENIOR)
                .status(CommonStatus.ACTIVE)
                .build();
    }
}

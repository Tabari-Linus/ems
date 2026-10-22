package com.mrlii.ems.accesslevel.helper;

import com.mrlii.ems.accesslevel.dto.AccessLevelFilterInput;
import com.mrlii.ems.accesslevel.dto.AccessLevelListItemResult;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.util.AccessLevelValidator;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
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
class AccessLevelServiceHelperTest {

    @Mock private AccessLevelRepository accessLevelRepository;
    @Mock private AccessLevelValidator validator;
    @Mock private PaginationHelper paginationHelper;
    @InjectMocks private AccessLevelServiceHelper serviceHelper;

    @Test
    void findByIdOrThrow_delegatesToValidator() {
        AccessLevel accessLevel = AccessLevel.builder().id(1L).accessLevelName("Admin").build();
        when(validator.findByIdOrThrow(1L)).thenReturn(accessLevel);

        AccessLevel result = serviceHelper.findByIdOrThrow(1L);

        assertThat(result).isEqualTo(accessLevel);
        verify(validator).findByIdOrThrow(1L);
    }

    @Test
    void getAccessLevels_withNullFilter_returnsPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<AccessLevel> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(accessLevelRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<AccessLevelListItemResult> result = serviceHelper.getAccessLevels(null, null, null);

        assertThat(result).isNotNull();
        assertThat(result.data()).isEmpty();
    }

    @Test
    void getAccessLevels_withStatusFilter_returnsFilteredPage() {
        AccessLevelFilterInput filter = new AccessLevelFilterInput(CommonStatus.ACTIVE, null);
        Pageable pageable = PageRequest.of(0, 20);
        AccessLevel accessLevel = AccessLevel.builder().id(1L).accessLevelName("Admin")
                .status(CommonStatus.ACTIVE).build();
        Page<AccessLevel> page = new PageImpl<>(List.of(accessLevel));
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(accessLevelRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<AccessLevelListItemResult> result = serviceHelper.getAccessLevels(
                filter, new PageInput(0, 20), null);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).accessLevelName()).isEqualTo("Admin");
    }

    @Test
    void getAccessLevels_withSearchFilter_returnsFilteredPage() {
        AccessLevelFilterInput filter = new AccessLevelFilterInput(null, "manager");
        Pageable pageable = PageRequest.of(0, 20);
        Page<AccessLevel> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(accessLevelRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<AccessLevelListItemResult> result = serviceHelper.getAccessLevels(
                filter, null, null);

        assertThat(result).isNotNull();
        verify(accessLevelRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAccessLevels_withAllFilters_returnsPage() {
        AccessLevelFilterInput filter = new AccessLevelFilterInput(CommonStatus.ACTIVE, "admin");
        Pageable pageable = PageRequest.of(0, 10);
        Page<AccessLevel> page = new PageImpl<>(List.of());
        when(paginationHelper.buildPageable(any(), any())).thenReturn(pageable);
        when(accessLevelRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResult<AccessLevelListItemResult> result = serviceHelper.getAccessLevels(
                filter, new PageInput(0, 10), new SortInput("accessLevelName", null));

        assertThat(result).isNotNull();
        verify(paginationHelper).buildPageable(any(), any());
    }
}

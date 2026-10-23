package com.mrlii.ems.accesslevel.service;

import com.mrlii.ems.accesslevel.dto.*;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.helper.AccessLevelPersistenceHelper;
import com.mrlii.ems.accesslevel.helper.AccessLevelServiceHelper;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.accesslevel.service.impl.AccessLevelServiceImpl;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessLevelServiceImplTest {

    @Mock private AccessLevelPersistenceHelper persistenceHelper;
    @Mock private AccessLevelServiceHelper serviceHelper;
    @Mock private PermissionSetRepository permissionSetRepository;
    @InjectMocks private AccessLevelServiceImpl service;

    // ── mutations ─────────────────────────────────────────────────────────────

    @Test
    void createAccessLevel_success_returnsActionResult() {
        CreateAccessLevelInput input = new CreateAccessLevelInput(
                "Admin", "Admin level", List.of(Permission.VIEW_EMPLOYEE), null);
        when(persistenceHelper.create(input)).thenReturn(buildAccessLevel(1L, "Admin"));

        ActionResult result = service.createAccessLevel(input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Admin");
    }

    @Test
    void updateAccessLevel_success_returnsActionResult() {
        UpdateAccessLevelInput input = new UpdateAccessLevelInput("Updated", null, null, null);
        when(persistenceHelper.update(1L, input)).thenReturn(buildAccessLevel(1L, "Updated"));

        ActionResult result = service.updateAccessLevel(1L, input);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Updated");
    }

    @Test
    void activateAccessLevel_success_returnsActionResult() {
        when(persistenceHelper.activate(1L)).thenReturn(buildAccessLevel(1L, "Admin"));

        ActionResult result = service.activateAccessLevel(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).activate(1L);
    }

    @Test
    void archiveAccessLevel_success_returnsActionResult() {
        when(persistenceHelper.archive(1L)).thenReturn(buildAccessLevel(1L, "Admin"));

        ActionResult result = service.archiveAccessLevel(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).archive(1L);
    }

    @Test
    void deleteAccessLevel_success_returnsActionResult() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(accessLevel);

        ActionResult result = service.deleteAccessLevel(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Admin");
        verify(persistenceHelper).softDelete(1L);
    }

    @Test
    void deleteAccessLevel_whenNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.findByIdOrThrow(99L)).thenThrow(new EntityNotFoundException("Access level with ID 99 not found"));

        assertThatThrownBy(() -> service.deleteAccessLevel(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void addPermissionsToAccessLevel_success_returnsActionResult() {
        List<Permission> permissions = List.of(Permission.VIEW_COMPANY, Permission.MANAGE_COMPANY);
        when(persistenceHelper.addPermissions(1L, permissions)).thenReturn(buildAccessLevel(1L, "Admin"));

        ActionResult result = service.addPermissionsToAccessLevel(1L, permissions);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).addPermissions(1L, permissions);
    }

    @Test
    void removePermissionsFromAccessLevel_success_returnsActionResult() {
        List<Permission> permissions = List.of(Permission.VIEW_COMPANY);
        when(persistenceHelper.removePermissions(1L, permissions)).thenReturn(buildAccessLevel(1L, "Admin"));

        ActionResult result = service.removePermissionsFromAccessLevel(1L, permissions);

        assertThat(result.id()).isEqualTo(1L);
        verify(persistenceHelper).removePermissions(1L, permissions);
    }

    // ── queries ───────────────────────────────────────────────────────────────

    @Test
    void getAccessLevel_success_returnsDetailResult() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(accessLevel);

        AccessLevelDetailResult result = service.getAccessLevel(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.accessLevelName()).isEqualTo("Admin");
        assertThat(result.status()).isEqualTo(CommonStatus.ACTIVE);
        assertThat(result.permissions()).isEmpty();
        assertThat(result.employees()).isEmpty();
    }

    @Test
    void getAccessLevels_success_returnsPageResult() {
        PageResult<AccessLevelListItemResult> expected = new PageResult<>(0, 0, 0, 20, false, false, List.of());
        when(serviceHelper.getAccessLevels(any(), any(), any())).thenReturn(expected);

        PageResult<AccessLevelListItemResult> result = service.getAccessLevels(
                new PageInput(0, 20), null, null);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getPermissionsByAccessLevel_success_returnsMappedList() {
        AccessLevel accessLevel = buildAccessLevel(1L, "Admin");
        PermissionSet ps = PermissionSet.builder().id(10L).permissionName(Permission.VIEW_EMPLOYEE).build();
        when(serviceHelper.findByIdOrThrow(1L)).thenReturn(accessLevel);
        when(permissionSetRepository.findAllByAccessLevelId(1L)).thenReturn(List.of(ps));

        List<PermissionSetResult> result = service.getPermissionsByAccessLevel(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(10L);
        assertThat(result.get(0).permissionName()).isEqualTo(Permission.VIEW_EMPLOYEE);
    }

    @Test
    void getPermissionsByAccessLevel_whenAccessLevelNotFound_propagatesEntityNotFoundException() {
        when(serviceHelper.findByIdOrThrow(99L)).thenThrow(new EntityNotFoundException("Access level with ID 99 not found"));

        assertThatThrownBy(() -> service.getPermissionsByAccessLevel(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AccessLevel buildAccessLevel(Long id, String name) {
        AccessLevel accessLevel = AccessLevel.builder()
                .id(id)
                .accessLevelName(name)
                .status(CommonStatus.ACTIVE)
                .build();
        accessLevel.setPermissions(new HashSet<>());
        accessLevel.setEmployees(List.of());
        return accessLevel;
    }
}

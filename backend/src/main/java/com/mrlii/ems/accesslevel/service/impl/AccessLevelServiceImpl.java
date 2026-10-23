package com.mrlii.ems.accesslevel.service.impl;

import com.mrlii.ems.accesslevel.dto.*;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.helper.AccessLevelPersistenceHelper;
import com.mrlii.ems.accesslevel.helper.AccessLevelServiceHelper;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.accesslevel.service.AccessLevelService;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.common.event.AccessLevelChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessLevelServiceImpl implements AccessLevelService {

    private final AccessLevelPersistenceHelper persistenceHelper;
    private final AccessLevelServiceHelper serviceHelper;
    private final PermissionSetRepository permissionSetRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ActionResult createAccessLevel(CreateAccessLevelInput input) {
        AccessLevel accessLevel = persistenceHelper.create(input);
        publishChanged(accessLevel.getId());
        log.info("Access level created: id={}, name={}", accessLevel.getId(), accessLevel.getAccessLevelName());
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult updateAccessLevel(Long id, UpdateAccessLevelInput input) {
        AccessLevel accessLevel = persistenceHelper.update(id, input);
        publishChanged(accessLevel.getId());
        log.info("Access level updated: id={}", id);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult activateAccessLevel(Long id) {
        AccessLevel accessLevel = persistenceHelper.activate(id);
        publishChanged(accessLevel.getId());
        log.info("Access level activated: id={}", id);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult archiveAccessLevel(Long id) {
        AccessLevel accessLevel = persistenceHelper.archive(id);
        publishChanged(accessLevel.getId());
        log.info("Access level archived: id={}", id);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult deleteAccessLevel(Long id) {
        AccessLevel accessLevel = serviceHelper.findByIdOrThrow(id);
        persistenceHelper.softDelete(id);
        publishChanged(id);
        log.info("Access level deleted: id={}", id);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult addPermissionsToAccessLevel(Long id, List<Permission> permissions) {
        AccessLevel accessLevel = persistenceHelper.addPermissions(id, permissions);
        publishChanged(accessLevel.getId());
        log.info("Permissions added to access level: id={}, permissions={}", id, permissions);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional
    public ActionResult removePermissionsFromAccessLevel(Long id, List<Permission> permissions) {
        AccessLevel accessLevel = persistenceHelper.removePermissions(id, permissions);
        publishChanged(accessLevel.getId());
        log.info("Permissions removed from access level: id={}, permissions={}", id, permissions);
        return new ActionResult(accessLevel.getId(), accessLevel.getAccessLevelName());
    }

    @Override
    @Transactional(readOnly = true)
    public AccessLevelDetailResult getAccessLevel(Long id) {
        AccessLevel accessLevel = serviceHelper.findByIdOrThrow(id);
        return AccessLevelDetailResult.of(accessLevel);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<AccessLevelListItemResult> getAccessLevels(
            PageInput pageInput, SortInput sortInput, AccessLevelFilterInput filter) {
        return serviceHelper.getAccessLevels(filter, pageInput, sortInput);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionSetResult> getPermissionsByAccessLevel(Long accessLevelId) {
        serviceHelper.findByIdOrThrow(accessLevelId);
        return permissionSetRepository.findAllByAccessLevelId(accessLevelId)
                .stream()
                .map(PermissionSetResult::of)
                .toList();
    }

    /** Permissions, status or membership changed: authorization caches must be refreshed. */
    private void publishChanged(Long accessLevelId) {
        eventPublisher.publishEvent(new AccessLevelChangedEvent(accessLevelId));
    }
}

package com.mrlii.ems.organization.position.service.impl;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.position.dto.CreatePositionInput;
import com.mrlii.ems.organization.position.dto.PositionDetailResult;
import com.mrlii.ems.organization.position.dto.PositionFilterInput;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;
import com.mrlii.ems.organization.position.dto.UpdatePositionInput;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.helper.PositionPersistenceHelper;
import com.mrlii.ems.organization.position.helper.PositionServiceHelper;
import com.mrlii.ems.organization.position.service.PositionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PositionServiceImpl implements PositionService {

    private final PositionPersistenceHelper persistenceHelper;
    private final PositionServiceHelper serviceHelper;

    @Override
    @Transactional
    public ActionResult createPosition(CreatePositionInput input) {
        Position position = persistenceHelper.create(input);
        log.info("Position created: id={}, name={}", position.getId(), position.getPositionName());
        return new ActionResult(position.getId(), position.getPositionName());
    }

    @Override
    @Transactional
    public ActionResult updatePosition(Long id, UpdatePositionInput input) {
        Position position = persistenceHelper.update(id, input);
        log.info("Position updated: id={}", id);
        return new ActionResult(position.getId(), position.getPositionName());
    }

    @Override
    @Transactional
    public ActionResult activatePosition(Long id) {
        Position position = persistenceHelper.activate(id);
        log.info("Position activated: id={}", id);
        return new ActionResult(position.getId(), position.getPositionName());
    }

    @Override
    @Transactional
    public ActionResult archivePosition(Long id) {
        Position position = persistenceHelper.archive(id);
        log.info("Position archived: id={}", id);
        return new ActionResult(position.getId(), position.getPositionName());
    }

    @Override
    @Transactional
    public ActionResult deletePosition(Long id) {
        Position position = serviceHelper.findByIdOrThrow(id);
        persistenceHelper.softDelete(id);
        log.info("Position deleted: id={}", id);
        return new ActionResult(position.getId(), position.getPositionName());
    }

    @Override
    @Transactional(readOnly = true)
    public PositionDetailResult getPosition(Long id) {
        Position position = serviceHelper.findByIdOrThrow(id);
        return PositionDetailResult.of(position);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<PositionListItemResult> getPositions(
            PageInput pageInput, SortInput sortInput, PositionFilterInput filter) {
        return serviceHelper.getPositions(filter, pageInput, sortInput);
    }
}

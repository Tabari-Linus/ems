package com.mrlii.ems.organization.position.service;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.position.dto.CreatePositionInput;
import com.mrlii.ems.organization.position.dto.PositionDetailResult;
import com.mrlii.ems.organization.position.dto.PositionFilterInput;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;
import com.mrlii.ems.organization.position.dto.UpdatePositionInput;

public interface PositionService {

    ActionResult createPosition(CreatePositionInput input);

    ActionResult updatePosition(Long id, UpdatePositionInput input);

    ActionResult activatePosition(Long id);

    ActionResult archivePosition(Long id);

    ActionResult deletePosition(Long id);

    PositionDetailResult getPosition(Long id);

    PageResult<PositionListItemResult> getPositions(PageInput pageInput, SortInput sortInput, PositionFilterInput filter);
}

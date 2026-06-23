package com.mrlii.ems.accesslevel.service;

import com.mrlii.ems.accesslevel.dto.*;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;

import java.util.List;

public interface AccessLevelService {

    ActionResult createAccessLevel(CreateAccessLevelInput input);

    ActionResult updateAccessLevel(Long id, UpdateAccessLevelInput input);

    ActionResult activateAccessLevel(Long id);

    ActionResult archiveAccessLevel(Long id);

    ActionResult deleteAccessLevel(Long id);

    ActionResult addPermissionsToAccessLevel(Long id, List<Permission> permissions);

    ActionResult removePermissionsFromAccessLevel(Long id, List<Permission> permissions);

    AccessLevelDetailResult getAccessLevel(Long id);

    PageResult<AccessLevelListItemResult> getAccessLevels(PageInput pageInput, SortInput sortInput, AccessLevelFilterInput filter);

    List<PermissionSetResult> getPermissionsByAccessLevel(Long accessLevelId);
}

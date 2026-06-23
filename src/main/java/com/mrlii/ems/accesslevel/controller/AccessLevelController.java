package com.mrlii.ems.accesslevel.controller;

import com.mrlii.ems.accesslevel.dto.*;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.service.AccessLevelService;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class AccessLevelController {

    private final AccessLevelService accessLevelService;

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult createAccessLevel(@Argument @Valid CreateAccessLevelInput input) {
        return accessLevelService.createAccessLevel(input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult updateAccessLevel(
            @Argument Long id,
            @Argument @Valid UpdateAccessLevelInput input
    ) {
        return accessLevelService.updateAccessLevel(id, input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult activateAccessLevel(@Argument Long id) {
        return accessLevelService.activateAccessLevel(id);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult archiveAccessLevel(@Argument Long id) {
        return accessLevelService.archiveAccessLevel(id);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult deleteAccessLevel(@Argument Long id) {
        return accessLevelService.deleteAccessLevel(id);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult addPermissionsToAccessLevel(
            @Argument Long id,
            @Argument List<Permission> permissions
    ) {
        return accessLevelService.addPermissionsToAccessLevel(id, permissions);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ACCESS_LEVEL')")
    @MutationMapping
    public ActionResult removePermissionsFromAccessLevel(
            @Argument Long id,
            @Argument List<Permission> permissions
    ) {
        return accessLevelService.removePermissionsFromAccessLevel(id, permissions);
    }

    // @PreAuthorize("hasAuthority('VIEW_ACCESS_LEVEL')")
    @QueryMapping
    public AccessLevelDetailResult getAccessLevel(@Argument Long id) {
        return accessLevelService.getAccessLevel(id);
    }

    // @PreAuthorize("hasAuthority('VIEW_ACCESS_LEVEL')")
    @QueryMapping
    public PageResult<AccessLevelListItemResult> getAccessLevels(
            @Argument PageInput pageInput,
            @Argument SortInput sortInput,
            @Argument AccessLevelFilterInput filter
    ) {
        return accessLevelService.getAccessLevels(pageInput, sortInput, filter);
    }

    // @PreAuthorize("hasAuthority('VIEW_ACCESS_LEVEL')")
    @QueryMapping
    public List<PermissionSetResult> getPermissionsByAccessLevel(@Argument Long accessLevelId) {
        return accessLevelService.getPermissionsByAccessLevel(accessLevelId);
    }
}

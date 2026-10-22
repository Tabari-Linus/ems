package com.mrlii.ems.organization.position.controller;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.position.dto.*;
import com.mrlii.ems.organization.position.service.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @PreAuthorize("hasAuthority('MANAGE_POSITION')")
    @MutationMapping
    public ActionResult createPosition(@Argument @Valid CreatePositionInput input) {
        return positionService.createPosition(input);
    }

    @PreAuthorize("hasAuthority('MANAGE_POSITION')")
    @MutationMapping
    public ActionResult updatePosition(@Argument Long id, @Argument @Valid UpdatePositionInput input) {
        return positionService.updatePosition(id, input);
    }

    @PreAuthorize("hasAuthority('MANAGE_POSITION')")
    @MutationMapping
    public ActionResult activatePosition(@Argument Long id) {
        return positionService.activatePosition(id);
    }

    @PreAuthorize("hasAuthority('MANAGE_POSITION')")
    @MutationMapping
    public ActionResult archivePosition(@Argument Long id) {
        return positionService.archivePosition(id);
    }

    @PreAuthorize("hasAuthority('MANAGE_POSITION')")
    @MutationMapping
    public ActionResult deletePosition(@Argument Long id) {
        return positionService.deletePosition(id);
    }

    @PreAuthorize("hasAuthority('VIEW_POSITION')")
    @QueryMapping
    public PositionDetailResult getPosition(@Argument Long id) {
        return positionService.getPosition(id);
    }

    @PreAuthorize("hasAuthority('VIEW_POSITION')")
    @QueryMapping
    public PageResult<PositionListItemResult> getPositions(
            @Argument PageInput pageInput,
            @Argument SortInput sortInput,
            @Argument PositionFilterInput filter
    ) {
        return positionService.getPositions(pageInput, sortInput, filter);
    }
}

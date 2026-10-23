package com.mrlii.ems.dashboard.controller;

import com.mrlii.ems.dashboard.dto.DashboardFilterInput;
import com.mrlii.ems.dashboard.dto.DashboardSummaryResult;
import com.mrlii.ems.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @PreAuthorize("hasAuthority('VIEW_DASHBOARD')")
    @QueryMapping
    public DashboardSummaryResult getDashboardSummary(@Argument DashboardFilterInput filter) {
        return dashboardService.getDashboardSummary(filter);
    }
}

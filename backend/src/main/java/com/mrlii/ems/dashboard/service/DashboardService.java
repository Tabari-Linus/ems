package com.mrlii.ems.dashboard.service;

import com.mrlii.ems.dashboard.dto.DashboardFilterInput;
import com.mrlii.ems.dashboard.dto.DashboardSummaryResult;

public interface DashboardService {
    DashboardSummaryResult getDashboardSummary(DashboardFilterInput filter);
}

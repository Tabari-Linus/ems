package com.mrlii.ems.dashboard.dto;

import java.util.List;

public record DashboardSummaryResult(
        int companyCount,
        int officeCount,
        int departmentCount,
        int activeEmployeeCount,
        HeadcountTrendResult headcountTrend,
        List<CompanyBreakdownResult> companyBreakdowns
) {}

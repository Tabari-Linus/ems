package com.mrlii.ems.dashboard.dto;

public record DashboardFilterInput(
        Long companyId,
        String periodStart,
        String periodEnd
) {}

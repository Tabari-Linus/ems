package com.mrlii.ems.dashboard.dto;

public record CompanyBreakdownResult(
        Long companyId,
        String companyName,
        int officeCount,
        int departmentCount,
        int activeEmployeeCount,
        int newHiresInPeriod
) {}

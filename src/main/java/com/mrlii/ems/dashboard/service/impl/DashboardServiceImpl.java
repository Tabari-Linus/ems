package com.mrlii.ems.dashboard.service.impl;

import com.mrlii.ems.dashboard.dto.CompanyBreakdownResult;
import com.mrlii.ems.dashboard.dto.DashboardFilterInput;
import com.mrlii.ems.dashboard.dto.DashboardSummaryResult;
import com.mrlii.ems.dashboard.dto.HeadcountTrendResult;
import com.mrlii.ems.dashboard.helper.DashboardQueryHelper;
import com.mrlii.ems.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardQueryHelper queryHelper;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResult getDashboardSummary(DashboardFilterInput filter) {
        Long companyId = filter != null ? filter.companyId() : null;

        PeriodBounds bounds = resolvePeriod(filter);

        int companyCount    = (int) queryHelper.countCompanies();
        int officeCount     = (int) queryHelper.countOffices(companyId);
        int departmentCount = (int) queryHelper.countDepartments(companyId);
        int activeEmployees = (int) queryHelper.countActiveEmployees(companyId);

        int currentHires  = (int) queryHelper.countNewHires(companyId, bounds.start(), bounds.end());
        int previousHires = (int) queryHelper.countNewHires(companyId, bounds.prevStart(), bounds.prevEnd());

        HeadcountTrendResult trend = HeadcountTrendResult.of(currentHires, previousHires);

        List<CompanyBreakdownResult> breakdowns =
                queryHelper.buildCompanyBreakdowns(companyId, bounds.start(), bounds.end());

        return new DashboardSummaryResult(
                companyCount, officeCount, departmentCount, activeEmployees, trend, breakdowns);
    }

    private PeriodBounds resolvePeriod(DashboardFilterInput filter) {
        LocalDate endDate   = parseOrDefault(filter != null ? filter.periodEnd()   : null, LocalDate.now());
        LocalDate startDate = parseOrDefault(filter != null ? filter.periodStart() : null, endDate.minusDays(30));

        long durationDays = ChronoUnit.DAYS.between(startDate, endDate);
        LocalDate prevEnd   = startDate.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(durationDays);

        return new PeriodBounds(
                startDate.atStartOfDay(),
                endDate.atTime(23, 59, 59),
                prevStart.atStartOfDay(),
                prevEnd.atTime(23, 59, 59));
    }

    private LocalDate parseOrDefault(String value, LocalDate fallback) {
        if (value == null || value.isBlank()) return fallback;
        return LocalDate.parse(value);
    }

    private record PeriodBounds(
            LocalDateTime start,
            LocalDateTime end,
            LocalDateTime prevStart,
            LocalDateTime prevEnd) {}
}

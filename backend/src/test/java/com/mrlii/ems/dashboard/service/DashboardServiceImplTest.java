package com.mrlii.ems.dashboard.service;

import com.mrlii.ems.dashboard.dto.CompanyBreakdownResult;
import com.mrlii.ems.dashboard.dto.DashboardFilterInput;
import com.mrlii.ems.dashboard.dto.DashboardSummaryResult;
import com.mrlii.ems.dashboard.dto.HeadcountTrendResult;
import com.mrlii.ems.dashboard.enums.TrendDirection;
import com.mrlii.ems.dashboard.helper.DashboardQueryHelper;
import com.mrlii.ems.dashboard.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock private DashboardQueryHelper queryHelper;
    @InjectMocks private DashboardServiceImpl service;

    // ── getDashboardSummary with null filter ──────────────────────────────────

    @Test
    void getDashboardSummary_nullFilter_usesDefaultPeriodAndNoCompanyFilter() {
        when(queryHelper.countCompanies()).thenReturn(3L);
        when(queryHelper.countOffices(null)).thenReturn(5L);
        when(queryHelper.countDepartments(null)).thenReturn(8L);
        when(queryHelper.countActiveEmployees(null)).thenReturn(20L);
        when(queryHelper.countNewHires(isNull(), any(), any())).thenReturn(4L, 2L);
        when(queryHelper.buildCompanyBreakdowns(isNull(), any(), any())).thenReturn(List.of());

        DashboardSummaryResult result = service.getDashboardSummary(null);

        assertThat(result.companyCount()).isEqualTo(3);
        assertThat(result.officeCount()).isEqualTo(5);
        assertThat(result.departmentCount()).isEqualTo(8);
        assertThat(result.activeEmployeeCount()).isEqualTo(20);
        assertThat(result.headcountTrend().currentPeriodNewHires()).isEqualTo(4);
        assertThat(result.headcountTrend().previousPeriodNewHires()).isEqualTo(2);
        assertThat(result.headcountTrend().trend()).isEqualTo(TrendDirection.INCREASE);
    }

    // ── getDashboardSummary with company filter ───────────────────────────────

    @Test
    void getDashboardSummary_withCompanyId_passesCompanyIdToHelper() {
        Long companyId = 42L;
        var filter = new DashboardFilterInput(companyId, "2026-01-01", "2026-03-31");

        when(queryHelper.countCompanies()).thenReturn(1L);
        when(queryHelper.countOffices(companyId)).thenReturn(2L);
        when(queryHelper.countDepartments(companyId)).thenReturn(3L);
        when(queryHelper.countActiveEmployees(companyId)).thenReturn(10L);
        when(queryHelper.countNewHires(eq(companyId), any(), any())).thenReturn(5L, 5L);
        when(queryHelper.buildCompanyBreakdowns(eq(companyId), any(), any())).thenReturn(List.of());

        DashboardSummaryResult result = service.getDashboardSummary(filter);

        verify(queryHelper).countOffices(companyId);
        verify(queryHelper).countDepartments(companyId);
        verify(queryHelper).countActiveEmployees(companyId);
        assertThat(result.headcountTrend().trend()).isEqualTo(TrendDirection.NEUTRAL);
    }

    // ── Period calculation ────────────────────────────────────────────────────

    @Test
    void getDashboardSummary_withExplicitPeriod_computesPreviousPeriodCorrectly() {
        // period: Jan 1 – Jan 31 (30 days)  →  previous: Dec 1 – Dec 31
        var filter = new DashboardFilterInput(null, "2026-01-01", "2026-01-31");

        when(queryHelper.countCompanies()).thenReturn(1L);
        when(queryHelper.countOffices(null)).thenReturn(1L);
        when(queryHelper.countDepartments(null)).thenReturn(1L);
        when(queryHelper.countActiveEmployees(null)).thenReturn(1L);
        when(queryHelper.buildCompanyBreakdowns(isNull(), any(), any())).thenReturn(List.of());

        ArgumentCaptor<LocalDateTime> startCaptor    = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor      = ArgumentCaptor.forClass(LocalDateTime.class);

        // first call = current period, second call = previous period
        when(queryHelper.countNewHires(isNull(), any(), any())).thenReturn(3L, 1L);

        service.getDashboardSummary(filter);

        // verify the current period window passed to the first countNewHires call
        verify(queryHelper).buildCompanyBreakdowns(
                isNull(),
                startCaptor.capture(),
                endCaptor.capture());

        LocalDateTime capturedStart = startCaptor.getValue();
        LocalDateTime capturedEnd   = endCaptor.getValue();

        assertThat(capturedStart).isEqualTo(LocalDate.of(2026, 1, 1).atStartOfDay());
        assertThat(capturedEnd.toLocalDate()).isEqualTo(LocalDate.of(2026, 1, 31));
    }

    // ── Company breakdowns ────────────────────────────────────────────────────

    @Test
    void getDashboardSummary_returnsCompanyBreakdownsFromHelper() {
        var breakdown = new CompanyBreakdownResult(1L, "Acme Corp", 2, 4, 15, 3);
        var filter = new DashboardFilterInput(null, null, null);

        when(queryHelper.countCompanies()).thenReturn(1L);
        when(queryHelper.countOffices(null)).thenReturn(2L);
        when(queryHelper.countDepartments(null)).thenReturn(4L);
        when(queryHelper.countActiveEmployees(null)).thenReturn(15L);
        when(queryHelper.countNewHires(isNull(), any(), any())).thenReturn(3L, 0L);
        when(queryHelper.buildCompanyBreakdowns(isNull(), any(), any())).thenReturn(List.of(breakdown));

        DashboardSummaryResult result = service.getDashboardSummary(filter);

        assertThat(result.companyBreakdowns()).hasSize(1);
        assertThat(result.companyBreakdowns().get(0).companyName()).isEqualTo("Acme Corp");
    }

    // ── Headcount trend directions ────────────────────────────────────────────

    @Test
    void getDashboardSummary_whenCurrentLessThanPrevious_trendIsDecrease() {
        when(queryHelper.countCompanies()).thenReturn(1L);
        when(queryHelper.countOffices(null)).thenReturn(1L);
        when(queryHelper.countDepartments(null)).thenReturn(1L);
        when(queryHelper.countActiveEmployees(null)).thenReturn(1L);
        when(queryHelper.countNewHires(isNull(), any(), any())).thenReturn(2L, 5L);
        when(queryHelper.buildCompanyBreakdowns(isNull(), any(), any())).thenReturn(List.of());

        DashboardSummaryResult result = service.getDashboardSummary(null);

        HeadcountTrendResult trend = result.headcountTrend();
        assertThat(trend.trend()).isEqualTo(TrendDirection.DECREASE);
        assertThat(trend.percentageChange()).isNegative();
    }

    @Test
    void getDashboardSummary_whenPreviousIsZeroAndCurrentIsZero_trendIsNeutral() {
        when(queryHelper.countCompanies()).thenReturn(0L);
        when(queryHelper.countOffices(null)).thenReturn(0L);
        when(queryHelper.countDepartments(null)).thenReturn(0L);
        when(queryHelper.countActiveEmployees(null)).thenReturn(0L);
        when(queryHelper.countNewHires(isNull(), any(), any())).thenReturn(0L, 0L);
        when(queryHelper.buildCompanyBreakdowns(isNull(), any(), any())).thenReturn(List.of());

        DashboardSummaryResult result = service.getDashboardSummary(null);

        assertThat(result.headcountTrend().trend()).isEqualTo(TrendDirection.NEUTRAL);
        assertThat(result.headcountTrend().percentageChange()).isNull();
    }
}

package com.mrlii.ems.dashboard.dto;

import com.mrlii.ems.dashboard.enums.TrendDirection;

public record HeadcountTrendResult(
        int currentPeriodNewHires,
        int previousPeriodNewHires,
        TrendDirection trend,
        Double percentageChange
) {
    public static HeadcountTrendResult of(int current, int previous) {
        TrendDirection trend;
        Double percentageChange;

        if (previous == 0) {
            trend = current > 0 ? TrendDirection.INCREASE : TrendDirection.NEUTRAL;
            percentageChange = null;
        } else if (current > previous) {
            trend = TrendDirection.INCREASE;
            percentageChange = ((double) (current - previous) / previous) * 100;
        } else if (current < previous) {
            trend = TrendDirection.DECREASE;
            percentageChange = ((double) (current - previous) / previous) * 100;
        } else {
            trend = TrendDirection.NEUTRAL;
            percentageChange = 0.0;
        }

        return new HeadcountTrendResult(current, previous, trend, percentageChange);
    }
}

package com.mrlii.ems.dashboard.dto;

import com.mrlii.ems.dashboard.enums.TrendDirection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class HeadcountTrendResultTest {

    @Test
    void of_whenCurrentGreaterThanPrevious_returnsIncrease() {
        HeadcountTrendResult result = HeadcountTrendResult.of(10, 5);

        assertThat(result.trend()).isEqualTo(TrendDirection.INCREASE);
        assertThat(result.currentPeriodNewHires()).isEqualTo(10);
        assertThat(result.previousPeriodNewHires()).isEqualTo(5);
        assertThat(result.percentageChange()).isCloseTo(100.0, within(0.01));
    }

    @Test
    void of_whenCurrentLessThanPrevious_returnsDecrease() {
        HeadcountTrendResult result = HeadcountTrendResult.of(3, 6);

        assertThat(result.trend()).isEqualTo(TrendDirection.DECREASE);
        assertThat(result.percentageChange()).isCloseTo(-50.0, within(0.01));
    }

    @Test
    void of_whenCurrentEqualsPrevious_returnsNeutral() {
        HeadcountTrendResult result = HeadcountTrendResult.of(4, 4);

        assertThat(result.trend()).isEqualTo(TrendDirection.NEUTRAL);
        assertThat(result.percentageChange()).isEqualTo(0.0);
    }

    @Test
    void of_whenPreviousIsZeroAndCurrentIsPositive_returnsIncreaseWithNullPercentage() {
        HeadcountTrendResult result = HeadcountTrendResult.of(5, 0);

        assertThat(result.trend()).isEqualTo(TrendDirection.INCREASE);
        assertThat(result.percentageChange()).isNull();
    }

    @Test
    void of_whenBothAreZero_returnsNeutralWithNullPercentage() {
        HeadcountTrendResult result = HeadcountTrendResult.of(0, 0);

        assertThat(result.trend()).isEqualTo(TrendDirection.NEUTRAL);
        assertThat(result.percentageChange()).isNull();
    }
}

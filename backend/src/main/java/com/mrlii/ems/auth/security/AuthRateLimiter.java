package com.mrlii.ems.auth.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.mrlii.ems.auth.exception.RateLimitedException;
import com.mrlii.ems.common.config.AuthProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Per-IP token buckets (Bucket4j, in memory) for the public, password-guessing-prone endpoints
 * ({@code /login}, {@code /set-password}). Each endpoint has its own bucket per IP:
 * {@code app.auth.rate-limit.capacity} requests per {@code app.auth.rate-limit.period}, refilled greedily.
 * In-memory buckets are per instance; a multi-instance deployment would move them to a shared store.
 */
@Component
public class AuthRateLimiter {

    public static final String LOGIN = "login";
    public static final String SET_PASSWORD = "set-password";

    static final long MAXIMUM_TRACKED_KEYS = 100_000;

    private final Cache<String, Bucket> buckets;
    private final int capacity;
    private final Duration period;

    public AuthRateLimiter(AuthProperties authProperties) {
        this.capacity = authProperties.rateLimit().capacity();
        this.period = authProperties.rateLimit().period();
        this.buckets = Caffeine.newBuilder()
                .expireAfterAccess(period.multipliedBy(2).plusMinutes(1))
                .maximumSize(MAXIMUM_TRACKED_KEYS)
                .build();
    }

    /** Consumes one request for {@code endpoint} from {@code ip}; throws 429 when the bucket is empty. */
    public void check(String endpoint, String ip) {
        String key = endpoint + '|' + (ip == null ? "unknown" : ip);
        Bucket bucket = buckets.get(key, ignored -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long seconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
            throw new RateLimitedException(seconds + 1);
        }
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build())
                .build();
    }
}

package com.mrlii.ems.auth.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.mrlii.ems.common.config.AuthProperties;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.function.Function;

/**
 * Short-lived cache of resolved principals keyed by account public id (TTL {@code app.auth.principal-cache-ttl},
 * default 60 s). Only usable accounts are cached; rejections are re-checked on every request.
 * Entries are evicted on access-level, employee-status and assignment changes
 * ({@code PrincipalCacheEvictionListener}), so revocation applies on the next request.
 */
@Component
public class PrincipalCache {

    static final long MAXIMUM_SIZE = 10_000;

    private final Cache<UUID, AuthenticatedAccount> cache;

    public PrincipalCache(AuthProperties authProperties) {
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(authProperties.principalCacheTtl())
                .maximumSize(MAXIMUM_SIZE)
                .build();
    }

    public AuthenticatedAccount get(UUID publicId, Function<UUID, AuthenticatedAccount> loader) {
        return cache.get(publicId, loader);
    }

    public AuthenticatedAccount getIfPresent(UUID publicId) {
        return cache.getIfPresent(publicId);
    }

    public void evictAll() {
        cache.invalidateAll();
    }

    public void evictAccount(Long accountId) {
        cache.asMap().values().removeIf(principal -> accountId.equals(principal.accountId()));
    }

    public void evictEmployee(Long employeeId) {
        cache.asMap().values().removeIf(principal -> employeeId.equals(principal.employeeId()));
    }
}

package com.mrlii.ems.notification.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class NotificationDeduplicationCache {

    private final Cache<String, Boolean> cache = Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    public boolean isDuplicate(String key) {
        return cache.getIfPresent(key) != null;
    }

    public void markSent(String key) {
        cache.put(key, Boolean.TRUE);
    }
}

package com.mrlii.ems.auth.exception;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import lombok.Getter;

/** 429 with a {@code Retry-After} header (seconds). */
@Getter
public class RateLimitedException extends AuthException {

    private final long retryAfterSeconds;

    public RateLimitedException(long retryAfterSeconds) {
        super(AuthErrorCode.RATE_LIMITED, "Too many attempts. Try again in a moment.");
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }
}

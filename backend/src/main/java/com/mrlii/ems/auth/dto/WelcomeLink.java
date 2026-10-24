package com.mrlii.ems.auth.dto;

import java.time.Instant;

/** The set-password link for a welcome email. {@code url} contains the raw token: never log it. */
public record WelcomeLink(String url, Instant expiresAt, long validForHours) {

    @Override
    public String toString() {
        return "WelcomeLink[url=****, expiresAt=" + expiresAt + "]";
    }
}

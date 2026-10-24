package com.mrlii.ems.auth.controller;

import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs in its own context: a tiny per-IP rate limit, and the legacy permissions claim switched off.
 */
@TestPropertySource(properties = {
        "app.auth.rate-limit.capacity=3",
        "app.auth.legacy-permissions-claim=false"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthAltConfigIT extends AbstractGraphQlIntegrationTest {

    @Order(1)
    @Test
    void legacyClaim_isAbsent_whenFlagIsOff_andAuthorizationStillWorks() {
        String token = obtainAdminAccessToken();

        assertThat(AuthAuthorizationIT.jwtPayload(token)).doesNotContain("\"permissions\"").doesNotContain("account_id");
        graphQlTester(token).document("query { getPositions { totalElements } }").execute().errors().verify();
    }

    @Order(2)
    @Test
    void setPassword_isRateLimitedPerIp_with429AndRetryAfter() {
        Map<String, String> body = Map.of("token", "unknown-token", "newPassword", "Whatever-Strong-1");
        for (int i = 0; i < 3; i++) {
            postJson("/set-password", body).expectStatus().isBadRequest();
        }

        postJson("/set-password", body)
                .expectStatus().isEqualTo(429)
                .expectHeader().exists(HttpHeaders.RETRY_AFTER)
                .expectBody().jsonPath("$.code").isEqualTo("RATE_LIMITED");
    }

    @Order(3)
    @Test
    void login_isRateLimitedPerIp() {
        // the first test in this class may already have used part of the login bucket
        boolean limited = false;
        for (int i = 0; i < 5 && !limited; i++) {
            limited = login("nobody@ems.test", "Wrong-Password-1").returnResult(Void.class)
                    .getStatus().value() == 429;
        }
        assertThat(limited).isTrue();
    }
}

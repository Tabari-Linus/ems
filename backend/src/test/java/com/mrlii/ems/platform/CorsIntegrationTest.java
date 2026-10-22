package com.mrlii.ems.platform;

import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class CorsIntegrationTest extends AbstractGraphQlIntegrationTest {

    private static final String ALLOWED_ORIGIN = "http://localhost:4200";
    private static final String UNKNOWN_ORIGIN = "http://evil.example.com";

    @Test
    void preflight_fromAllowedOrigin_succeedsWithCredentials() {
        webTestClient().options()
                .uri(GRAPHQL_PATH)
                .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type,apollo-require-preflight")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN)
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true")
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "3600");
    }

    @Test
    void preflight_fromUnknownOrigin_isRejected() {
        webTestClient().options()
                .uri(GRAPHQL_PATH)
                .header(HttpHeaders.ORIGIN, UNKNOWN_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .exchange()
                .expectStatus().isForbidden()
                .expectHeader().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
    }
}

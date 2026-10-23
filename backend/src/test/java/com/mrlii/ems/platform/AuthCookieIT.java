package com.mrlii.ems.platform;

import com.mrlii.ems.common.config.AuthCookieProperties;
import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCookieIT extends AbstractGraphQlIntegrationTest {

    @Autowired
    private AuthCookieProperties cookieProperties;

    @Test
    void login_setsRefreshCookie_withConfiguredAttributes() {
        List<String> setCookies = loginAsAdmin()
                .expectStatus().isOk()
                .returnResult(Void.class)
                .getResponseHeaders()
                .get(HttpHeaders.SET_COOKIE);

        assertThat(setCookies).isNotNull();
        String refreshCookie = setCookies.stream()
                .filter(header -> header.startsWith("refresh_token="))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No refresh_token cookie in " + setCookies));

        assertThat(cookieProperties.path()).isEqualTo("/api/v1/auth");
        assertThat(refreshCookie)
                .contains("Path=/api/v1/auth")
                .contains("HttpOnly")
                .contains("SameSite=" + cookieProperties.sameSite())
                .doesNotContain("Secure");
    }

    @Test
    void login_refreshCookie_isAcceptedByRefreshEndpoint() {
        ResponseCookie refreshCookie = loginAsAdmin()
                .expectStatus().isOk()
                .returnResult(Void.class)
                .getResponseCookies()
                .getFirst("refresh_token");
        assertThat(refreshCookie).isNotNull();

        webTestClient().post()
                .uri(AUTH_PATH + "/refresh-token")
                .cookie(refreshCookie.getName(), refreshCookie.getValue())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.accessToken").isNotEmpty();
    }
}

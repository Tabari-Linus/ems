package com.mrlii.ems.auth.security;

import com.mrlii.ems.common.config.CorsProperties;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCsrfFilterTest {

    private static final String ALLOWED = "http://localhost:4200";
    private AuthCsrfFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthCsrfFilter(new CorsProperties(List.of(ALLOWED + "/")),
                new AuthErrorResponseWriter(JsonMapper.builder().build()));
    }

    private MockHttpServletRequest post(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRequestURI(path);
        return request;
    }

    private MockHttpServletResponse run(MockHttpServletRequest request, FilterChain chain) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    void protectedPath_withHeaderAndAllowedOrigin_passes() throws Exception {
        MockHttpServletRequest request = post("/api/v1/auth/refresh-token");
        request.addHeader("X-Requested-With", "ems-web");
        request.addHeader("Origin", ALLOWED);
        MockFilterChain chain = new MockFilterChain();

        MockHttpServletResponse response = run(request, chain);

        assertThat(chain.getRequest()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void protectedPath_withoutHeader_is403CsrfRejected() throws Exception {
        MockHttpServletRequest request = post("/api/v1/auth/logout");
        request.addHeader("Origin", ALLOWED);
        MockFilterChain chain = new MockFilterChain();

        MockHttpServletResponse response = run(request, chain);

        assertThat(chain.getRequest()).isNull();
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("\"code\":\"CSRF_REJECTED\"");
    }

    @Test
    void protectedPath_foreignOrigin_isRejected() throws Exception {
        MockHttpServletRequest request = post("/api/v1/auth/logout-all");
        request.addHeader("X-Requested-With", "ems-web");
        request.addHeader("Origin", "https://evil.example.com");
        MockFilterChain chain = new MockFilterChain();

        assertThat(run(request, chain).getStatus()).isEqualTo(403);
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    void protectedPath_noOrigin_fallsBackToReferer() throws Exception {
        MockHttpServletRequest ok = post("/api/v1/auth/refresh-token");
        ok.addHeader("X-Requested-With", "ems-web");
        ok.addHeader("Referer", ALLOWED + "/dashboard?x=1");
        MockFilterChain okChain = new MockFilterChain();
        run(ok, okChain);
        assertThat(okChain.getRequest()).isNotNull();

        MockHttpServletRequest missing = post("/api/v1/auth/refresh-token");
        missing.addHeader("X-Requested-With", "ems-web");
        assertThat(run(missing, new MockFilterChain()).getStatus()).isEqualTo(403);

        MockHttpServletRequest garbage = post("/api/v1/auth/refresh-token");
        garbage.addHeader("X-Requested-With", "ems-web");
        garbage.addHeader("Origin", "null");
        garbage.addHeader("Referer", "not a uri ::");
        assertThat(run(garbage, new MockFilterChain()).getStatus()).isEqualTo(403);
    }

    @Test
    void unprotectedPathsAndMethods_areNotFiltered() throws Exception {
        MockFilterChain loginChain = new MockFilterChain();
        run(post("/api/v1/auth/login"), loginChain);
        assertThat(loginChain.getRequest()).isNotNull();

        MockHttpServletRequest get = new MockHttpServletRequest("GET", "/api/v1/auth/logout");
        get.setRequestURI("/api/v1/auth/logout");
        MockFilterChain getChain = new MockFilterChain();
        run(get, getChain);
        assertThat(getChain.getRequest()).isNotNull();
    }

    @Test
    void requestOrigin_keepsExplicitPort() {
        MockHttpServletRequest request = post("/x");
        request.addHeader("Referer", "https://App.Example.com:8443/path");

        assertThat(AuthCsrfFilter.requestOrigin(request)).isEqualTo("https://app.example.com:8443");
    }
}

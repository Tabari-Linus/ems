package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import com.mrlii.ems.auth.exception.RateLimitedException;
import com.mrlii.ems.common.config.AuthProperties;
import com.mrlii.ems.support.AuthTestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Entry point, access-denied handler, bearer resolver, rate limiter and current-account lookup. */
class AuthSecurityComponentsTest {

    private final AuthErrorResponseWriter writer = new AuthErrorResponseWriter(JsonMapper.builder().build());

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    // ── entry point ───────────────────────────────────────────────────────────

    private MockHttpServletResponse commence(org.springframework.security.core.AuthenticationException ex) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        new JsonAuthenticationEntryPoint(writer).commence(new MockHttpServletRequest(), response, ex);
        return response;
    }

    @Test
    void entryPoint_missingToken_isUnauthenticatedWithHeader() throws Exception {
        MockHttpServletResponse response = commence(new InsufficientAuthenticationException("no"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getHeader("WWW-Authenticate")).startsWith("Bearer");
        assertThat(response.getContentAsString()).contains("\"code\":\"UNAUTHENTICATED\"");
    }

    @Test
    void entryPoint_expiredOrInvalidJwt_isDistinguished() throws Exception {
        assertThat(commence(new InvalidBearerTokenException("An error occurred: Jwt expired at 2026"))
                .getContentAsString()).contains("TOKEN_EXPIRED");
        assertThat(commence(new InvalidBearerTokenException("bad signature"))
                .getContentAsString()).contains("TOKEN_INVALID");
    }

    @Test
    void entryPoint_accountDenied_carriesItsCodeAndMessage() throws Exception {
        MockHttpServletResponse response = commence(
                new AccountAccessDeniedException(AuthErrorCode.ACCOUNT_INACTIVE, "Your account is deactivated."));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString())
                .contains("ACCOUNT_INACTIVE")
                .contains("Your account is deactivated.");
        assertThat(commence(new AccountAccessDeniedException(AuthErrorCode.TOKEN_INVALID, "gone"))
                .getContentAsString()).contains("gone");
    }

    @Test
    void writer_skipsCommittedResponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setCommitted(true);

        writer.write(response, 403, AuthErrorCode.FORBIDDEN, "x");

        assertThat(response.getContentAsString()).isEmpty();
    }

    @Test
    void accessDeniedHandler_writes403Json() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        new JsonAccessDeniedHandler(writer).handle(new MockHttpServletRequest(), response, new AccessDeniedException("no"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("\"code\":\"FORBIDDEN\"");
    }

    // ── bearer token resolver ─────────────────────────────────────────────────

    @Test
    void bearerResolver_ignoresHeaderOnPublicAuthPaths() {
        PublicAuthPathBearerTokenResolver resolver = new PublicAuthPathBearerTokenResolver();
        MockHttpServletRequest refresh = new MockHttpServletRequest("POST", "/api/v1/auth/refresh-token");
        refresh.setRequestURI("/api/v1/auth/refresh-token");
        refresh.addHeader("Authorization", "Bearer abc");
        MockHttpServletRequest graphql = new MockHttpServletRequest("POST", "/graphql");
        graphql.setRequestURI("/graphql");
        graphql.addHeader("Authorization", "Bearer abc");

        assertThat(resolver.resolve(refresh)).isNull();
        assertThat(resolver.resolve(graphql)).isEqualTo("abc");
    }

    // ── rate limiter ──────────────────────────────────────────────────────────

    @Test
    void rateLimiter_allowsCapacityThenRejectsWithRetryAfter_perIpAndEndpoint() {
        AuthRateLimiter limiter = new AuthRateLimiter(AuthTestData.authProperties()); // capacity 3 / minute
        for (int i = 0; i < 3; i++) {
            limiter.check(AuthRateLimiter.LOGIN, "1.1.1.1");
        }

        assertThatThrownBy(() -> limiter.check(AuthRateLimiter.LOGIN, "1.1.1.1"))
                .isInstanceOfSatisfying(RateLimitedException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(AuthErrorCode.RATE_LIMITED);
                    assertThat(e.getRetryAfterSeconds()).isBetween(1L, 61L);
                });
        assertThatCode(() -> limiter.check(AuthRateLimiter.LOGIN, "2.2.2.2")).doesNotThrowAnyException();
        assertThatCode(() -> limiter.check(AuthRateLimiter.SET_PASSWORD, "1.1.1.1")).doesNotThrowAnyException();
        assertThatCode(() -> limiter.check(AuthRateLimiter.SET_PASSWORD, null)).doesNotThrowAnyException();
    }

    @Test
    void rateLimitedException_retryAfterIsAtLeastOneSecond() {
        assertThat(new RateLimitedException(0).getRetryAfterSeconds()).isEqualTo(1);
    }

    // ── current account ───────────────────────────────────────────────────────

    @Test
    void currentAccount_fromAccountToken() {
        AuthenticatedAccount principal = new AuthenticatedAccount(1L, UUID.randomUUID(), "a@b.c", 2L, 3L, Set.of());
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "RS256").subject(principal.publicId().toString()).build();
        SecurityContextHolder.getContext().setAuthentication(new AccountAuthenticationToken(jwt, principal));

        assertThat(new CurrentAccountProvider().requireAccount()).isEqualTo(principal);
    }

    @Test
    void currentAccount_otherAuthentication_isUnauthenticated() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("u", "p"));
        CurrentAccountProvider provider = new CurrentAccountProvider();

        assertThatThrownBy(provider::requireAccount)
                .isInstanceOf(AuthException.class)
                .extracting("code").isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }

    @Test
    void authProperties_defaultsAreUsableViaTestData() {
        AuthProperties properties = AuthTestData.authProperties(true);

        assertThat(properties.legacyPermissionsClaim()).isTrue();
        assertThat(properties.principalCacheTtl()).isEqualTo(Duration.ofSeconds(60));
    }
}

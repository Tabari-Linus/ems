package com.mrlii.ems.auth.controller;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.repository.AuditEventRepository;
import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import com.mrlii.ems.auth.repository.AuthSessionRepository;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.util.TokenHasher;
import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Login, refresh rotation, reuse detection, multi-device sessions, logout, CSRF and error bodies. */
class AuthSessionIT extends AbstractGraphQlIntegrationTest {

    private static final String PASSWORD = "Integration-Pass-77";
    private static final String QUERY = "query { getPositions { totalElements } }";

    @Autowired private AuthSessionRepository sessionRepository;
    @Autowired private UserAccountRepository userAccountRepository;
    @Autowired private AuditEventRepository auditEventRepository;
    @Autowired private TokenHasher tokenHasher;

    private AuthSession stored(String rawRefreshToken) {
        return sessionRepository.findAll().stream()
                .filter(s -> s.getTokenHash().equals(tokenHasher.hash(rawRefreshToken)))
                .findFirst().orElseThrow();
    }

    @Test
    void refresh_rotatesToken_andReusingTheOldOneRevokesTheFamily() {
        Session first = loginSession(adminProperties.email(), adminProperties.password());
        Session second = refreshSession(first.refreshToken());

        assertThat(second.refreshToken()).isNotEqualTo(first.refreshToken());
        AuthSession old = stored(first.refreshToken());
        AuthSession current = stored(second.refreshToken());
        assertThat(old.getRevokedReason()).isEqualTo(SessionRevocationReason.ROTATED);
        assertThat(old.getReplacedBy()).isEqualTo(current.getId());
        assertThat(current.getFamilyId()).isEqualTo(old.getFamilyId());
        // only the hash is stored
        assertThat(sessionRepository.findAll()).noneMatch(s -> s.getTokenHash().equals(second.refreshToken()));

        cookiePost("/refresh-token", first.refreshToken()).exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.code").isEqualTo("TOKEN_INVALID");

        assertThat(stored(second.refreshToken()).getRevokedReason()).isEqualTo(SessionRevocationReason.REUSE_DETECTED);
        cookiePost("/refresh-token", second.refreshToken()).exchange().expectStatus().isUnauthorized();
        Long adminId = userAccountRepository.findByEmailWithAccess(adminProperties.email()).orElseThrow().getId();
        assertThat(auditEventRepository.findAllByActorAccountIdAndActionOrderByIdAsc(adminId, AuditAction.SESSION_REUSE_DETECTED))
                .isNotEmpty();
    }

    @Test
    void twoDevices_refreshIndependently() {
        Session laptop = loginSession(adminProperties.email(), adminProperties.password());
        Session phone = loginSession(adminProperties.email(), adminProperties.password());

        Session laptop2 = refreshSession(laptop.refreshToken());
        Session phone2 = refreshSession(phone.refreshToken());
        Session laptop3 = refreshSession(laptop2.refreshToken());

        assertThat(stored(laptop3.refreshToken()).getFamilyId()).isNotEqualTo(stored(phone2.refreshToken()).getFamilyId());
        graphQlTester(phone2.accessToken()).document(QUERY).execute().errors().verify();
        graphQlTester(laptop3.accessToken()).document(QUERY).execute().errors().verify();
    }

    @Test
    void logout_endsOnlyThisDevice_logoutAll_endsEverything() {
        Session a = loginSession(adminProperties.email(), adminProperties.password());
        Session b = loginSession(adminProperties.email(), adminProperties.password());
        Session c = loginSession(adminProperties.email(), adminProperties.password());

        cookiePost("/logout", a.refreshToken()).exchange()
                .expectStatus().isNoContent()
                .expectHeader().value(HttpHeaders.SET_COOKIE, v -> assertThat(v).contains("refresh_token=").contains("Max-Age=0"));
        cookiePost("/refresh-token", a.refreshToken()).exchange().expectStatus().isUnauthorized();
        Session b2 = refreshSession(b.refreshToken());

        cookiePost("/logout-all", null).header(HttpHeaders.AUTHORIZATION, "Bearer " + b2.accessToken()).exchange()
                .expectStatus().isNoContent();

        cookiePost("/refresh-token", b2.refreshToken()).exchange().expectStatus().isUnauthorized();
        cookiePost("/refresh-token", c.refreshToken()).exchange().expectStatus().isUnauthorized();
        assertThat(stored(c.refreshToken()).getRevokedReason()).isEqualTo(SessionRevocationReason.LOGOUT_ALL);
    }

    @Test
    void logoutAll_requiresBearer() {
        cookiePost("/logout-all", null).exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void cookieEndpoints_requireCsrfHeaderAndAllowedOrigin() {
        Session session = loginSession(adminProperties.email(), adminProperties.password());

        webTestClient().post().uri(AUTH_PATH + "/refresh-token")
                .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                .cookie("refresh_token", session.refreshToken())
                .exchange()
                .expectStatus().isForbidden()
                .expectBody().jsonPath("$.code").isEqualTo("CSRF_REJECTED");

        webTestClient().post().uri(AUTH_PATH + "/logout")
                .header("X-Requested-With", "ems-web")
                .header(HttpHeaders.ORIGIN, "https://evil.example.com")
                .cookie("refresh_token", session.refreshToken())
                .exchange()
                .expectStatus().isForbidden();

        // the session survived both rejected attempts
        refreshSession(session.refreshToken());
    }

    @Test
    void refresh_withoutCookie_isTokenInvalid_andStaleBearerIsIgnored() {
        cookiePost("/refresh-token", null)
                .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.code").isEqualTo("TOKEN_INVALID");
    }

    @Test
    void login_isCaseInsensitive_andUpdatesLastLogin() {
        login(adminProperties.email().toUpperCase(), adminProperties.password()).expectStatus().isOk();

        assertThat(userAccountRepository.findByEmailWithAccess(adminProperties.email()).orElseThrow().getLastLoginAt())
                .isNotNull();
    }

    @Test
    void login_wrongPassword_isInvalidCredentialsJson() {
        login(adminProperties.email(), "Wrong-Password-1").expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.code").isEqualTo("INVALID_CREDENTIALS")
                .jsonPath("$.message").isEqualTo("Invalid email or password");
        // do not let this test lock the shared admin account
        userAccountRepository.findByEmailWithAccess(adminProperties.email()).ifPresent(a -> {
            a.setFailedLoginAttempts(0);
            userAccountRepository.save(a);
        });
    }

    @Test
    void invalidBody_is400WithViolations_notAnEmpty401() {
        postJson("/login", Map.of("email", "not-an-email", "password", ""))
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.code").isEqualTo("VALIDATION_ERROR")
                .jsonPath("$.violations[?(@.field == 'email')]").exists()
                .jsonPath("$.violations[?(@.field == 'password')]").exists();

        webTestClient().post().uri(AUTH_PATH + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{not json")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.code").isEqualTo("VALIDATION_ERROR");
    }

    @Test
    void expiredOrForeignAccessToken_isRejectedWithJson401() {
        webTestClient().post().uri(GRAPHQL_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("query", QUERY))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().exists(HttpHeaders.WWW_AUTHENTICATE)
                .expectBody().jsonPath("$.code").isEqualTo("TOKEN_INVALID");
    }
}

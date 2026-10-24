package com.mrlii.ems.auth.controller;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.event.EmployeeAccessChangedEvent;
import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Per-request authorization: status gates, archived access levels, the me query, the legacy claim. */
class AuthAuthorizationIT extends AbstractGraphQlIntegrationTest {

    private static final String PASSWORD = "Integration-Pass-77";
    private static final String POSITIONS = "query { getPositions { totalElements } }";

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ApplicationEventPublisher eventPublisher;

    private Long createAccessLevel(String name, String permissions) {
        String id = adminGraphQlTester().document("""
                        mutation { createAccessLevel(input: { accessLevelName: "%s", permissions: [%s] }) { id } }
                        """.formatted(name, permissions))
                .execute().errors().verify()
                .path("createAccessLevel.id").entity(String.class).get();
        return Long.valueOf(id);
    }

    private void expect401(String accessToken, String code) {
        webTestClient().post().uri(GRAPHQL_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("query", POSITIONS))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.code").isEqualTo(code);
    }

    @Test
    void deactivatedEmployee_existingAccessTokenIsRejectedOnNextRequest() {
        String email = uniqueEmail("deactivated");
        Long levelId = createAccessLevel("Viewers " + email.substring(12, 20), "VIEW_POSITION");
        Long employeeId = onboardEmployee(email, levelId, PASSWORD);
        Session session = loginSession(email, PASSWORD);
        graphQlTester(session.accessToken()).document(POSITIONS).execute().errors().verify(); // now cached

        jdbcTemplate.update("UPDATE employees SET status = 'INACTIVE' WHERE id = ?", employeeId);
        eventPublisher.publishEvent(new EmployeeAccessChangedEvent(employeeId, CommonStatus.INACTIVE));

        expect401(session.accessToken(), "ACCOUNT_INACTIVE");
        cookiePost("/refresh-token", session.refreshToken()).exchange().expectStatus().is4xxClientError();
        login(email, PASSWORD).expectStatus().isForbidden()
                .expectBody().jsonPath("$.message").isEqualTo("Your account is deactivated. Contact your administrator.");
    }

    @Test
    void archivedEmployee_viaMutation_isRejectedAndSessionsRevoked() {
        String email = uniqueEmail("archived");
        Long levelId = createAccessLevel("Archivable " + email.substring(9, 17), "VIEW_POSITION");
        Long employeeId = onboardEmployee(email, levelId, PASSWORD);
        Session session = loginSession(email, PASSWORD);
        graphQlTester(session.accessToken()).document(POSITIONS).execute().errors().verify();

        adminGraphQlTester().document("mutation { archiveEmployee(id: %d) { id } }".formatted(employeeId))
                .execute().errors().verify();

        expect401(session.accessToken(), "ACCOUNT_INACTIVE");
        Integer active = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM auth_sessions s JOIN user_accounts u ON u.id = s.user_account_id
                WHERE u.employee_id = ? AND s.revoked_at IS NULL
                """, Integer.class, employeeId);
        assertThat(active).isZero();
    }

    @Test
    void archivedAccessLevel_grantsNothing_immediately() {
        String email = uniqueEmail("level");
        Long levelId = createAccessLevel("Temp " + email.substring(6, 14), "VIEW_POSITION");
        onboardEmployee(email, levelId, PASSWORD);
        Session session = loginSession(email, PASSWORD);
        graphQlTester(session.accessToken()).document(POSITIONS).execute().errors().verify();

        adminGraphQlTester().document("mutation { archiveAccessLevel(id: %d) { id } }".formatted(levelId))
                .execute().errors().verify();

        graphQlTester(session.accessToken()).document(POSITIONS).execute()
                .errors().expect(error -> "FORBIDDEN".equals(error.getExtensions().get("code"))).verify();
        graphQlTester(session.accessToken()).document("query { me { permissions } }").execute()
                .errors().verify()
                .path("me.permissions").entityList(String.class).hasSize(0);
    }

    @Test
    void me_returnsAccountEmployeeAndPermissions() {
        graphQlTester(obtainAdminAccessToken()).document("""
                        query { me {
                          account { id email lastLoginAt }
                          employee { id firstName workEmail status }
                          permissions
                        } }
                        """)
                .execute().errors().verify()
                .path("me.account.email").entity(String.class).isEqualTo(adminProperties.email())
                .path("me.account.id").entity(String.class).satisfies(id -> assertThat(id).hasSize(36))
                .path("me.account.lastLoginAt").hasValue()
                .path("me.employee.workEmail").entity(String.class).isEqualTo(adminProperties.email())
                .path("me.employee.status").entity(String.class).isEqualTo("ACTIVE")
                .path("me.permissions").entityList(String.class).contains("MANAGE_ACCESS_LEVEL", "VIEW_DASHBOARD");
    }

    @Test
    void me_requiresAuthentication() {
        webTestClient().post().uri(GRAPHQL_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("query", "query { me { permissions } }"))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void accessToken_hasStandardClaims_andLegacyPermissionsWhileFlagIsOn() {
        String payload = jwtPayload(obtainAdminAccessToken());

        assertThat(payload)
                .contains("\"iss\":\"ems-api\"")
                .contains("\"aud\":\"ems-web\"")
                .contains("\"jti\"")
                .contains("\"sid\"")
                .contains("\"permissions\"")
                .contains("\"account_id\"");
        long lifetime = Long.parseLong(payload.replaceAll(".*\"exp\":(\\d+).*", "$1"))
                - Long.parseLong(payload.replaceAll(".*\"iat\":(\\d+).*", "$1"));
        assertThat(lifetime).isEqualTo(900);
    }

    static String jwtPayload(String jwt) {
        return new String(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]), StandardCharsets.UTF_8);
    }
}

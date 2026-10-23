package com.mrlii.ems.auth.controller;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.repository.AuditEventRepository;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Employee creation → welcome link → set password → login; lockout; change password. */
class AuthOnboardingIT extends AbstractGraphQlIntegrationTest {

    private static final String PASSWORD = "Integration-Pass-77";
    private static final String NEW_PASSWORD = "Another-Strong-Pass-88";

    @Autowired private UserAccountRepository userAccountRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private AuditEventRepository auditEventRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private UserAccount account(String email) {
        return userAccountRepository.findByEmailWithAccess(email).orElseThrow();
    }

    @Test
    void createEmployee_sendsSetPasswordLink_withoutAnyPassword_andAccountStartsPending() {
        String email = uniqueEmail("welcome");
        Long employeeId = createEmployee(email, null);

        EmailRequest welcome = awaitWelcomeEmail(email);
        assertThat(welcome.textBody())
                .contains("http://localhost:4200/set-password?token=")
                .contains("72 hours")
                .doesNotContainIgnoringCase("temporary password");
        assertThat(welcome.htmlBody()).contains("/set-password?token=").doesNotContainIgnoringCase("password:");
        assertThat(account(email).getPasswordHash()).isNull();
        assertThat(employeeRepository.findById(employeeId).orElseThrow().getStatus()).isEqualTo(CommonStatus.PENDING);
        // only the hash is stored
        String token = tokenFromEmail(welcome);
        Integer plain = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM one_time_tokens WHERE token_hash = ?", Integer.class, token);
        assertThat(plain).isZero();

        login(email, "Anything-123456").expectStatus().isForbidden()
                .expectBody().jsonPath("$.code").isEqualTo("ACCOUNT_PENDING");
    }

    @Test
    void setPassword_activatesEmployee_isSingleUse_andAllowsLogin() {
        String email = uniqueEmail("setpw");
        Long employeeId = createEmployee(email, null);
        String token = tokenFromEmail(awaitWelcomeEmail(email));

        postJson("/set-password", Map.of("token", token, "newPassword", "short"))
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.code").isEqualTo("PASSWORD_POLICY")
                .jsonPath("$.violations[0].field").isEqualTo("newPassword");

        postJson("/set-password", Map.of("token", token, "newPassword", PASSWORD))
                .expectStatus().isNoContent();

        assertThat(employeeRepository.findById(employeeId).orElseThrow().getStatus()).isEqualTo(CommonStatus.ACTIVE);
        postJson("/set-password", Map.of("token", token, "newPassword", NEW_PASSWORD))
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.code").isEqualTo("TOKEN_INVALID");
        loginSession(email.toUpperCase(), PASSWORD);
        assertThat(auditEventRepository.findAllByActorAccountIdAndActionOrderByIdAsc(
                account(email).getId(), AuditAction.PASSWORD_SET)).hasSize(1);
    }

    @Test
    void setPassword_expiredToken_isTokenExpired() {
        String email = uniqueEmail("expired");
        createEmployee(email, null);
        String token = tokenFromEmail(awaitWelcomeEmail(email));
        jdbcTemplate.update("UPDATE one_time_tokens SET expires_at = now() - interval '1 minute' WHERE user_account_id = ?",
                account(email).getId());

        postJson("/set-password", Map.of("token", token, "newPassword", PASSWORD))
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.code").isEqualTo("TOKEN_EXPIRED");
    }

    @Test
    void fiveFailedLogins_lockTheAccount_evenForTheRightPassword() {
        String email = uniqueEmail("lockout");
        onboardEmployee(email, null, PASSWORD);

        for (int i = 1; i <= 4; i++) {
            login(email, "Wrong-Password-" + i).expectStatus().isUnauthorized()
                    .expectBody().jsonPath("$.code").isEqualTo("INVALID_CREDENTIALS");
        }
        login(email, "Wrong-Password-5").expectStatus().isEqualTo(423)
                .expectBody().jsonPath("$.code").isEqualTo("ACCOUNT_LOCKED");
        login(email, PASSWORD).expectStatus().isEqualTo(423);

        UserAccount locked = account(email);
        assertThat(locked.getLockedUntil()).isNotNull();
        assertThat(auditEventRepository.findAllByActorAccountIdAndActionOrderByIdAsc(locked.getId(), AuditAction.ACCOUNT_LOCKED))
                .hasSize(1);
        assertThat(auditEventRepository.findAllByActorAccountIdAndActionOrderByIdAsc(locked.getId(), AuditAction.LOGIN_FAILED))
                .hasSizeGreaterThanOrEqualTo(6);
    }

    @Test
    void changePassword_keepsThisSession_andRevokesTheOthers() {
        String email = uniqueEmail("changepw");
        onboardEmployee(email, null, PASSWORD);
        Session current = loginSession(email, PASSWORD);
        Session other = loginSession(email, PASSWORD);

        webTestClient().post().uri(AUTH_PATH + "/change-password")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + current.accessToken())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", "Not-The-Password-1", "newPassword", NEW_PASSWORD))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.code").isEqualTo("INVALID_CREDENTIALS");

        webTestClient().post().uri(AUTH_PATH + "/change-password")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + current.accessToken())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASSWORD, "newPassword", NEW_PASSWORD))
                .exchange()
                .expectStatus().isNoContent();

        refreshSession(current.refreshToken());
        cookiePost("/refresh-token", other.refreshToken()).exchange().expectStatus().isUnauthorized();
        login(email, PASSWORD).expectStatus().isUnauthorized();
        loginSession(email, NEW_PASSWORD);
    }

    @Test
    void changePassword_requiresAuthentication() {
        postJson("/change-password", Map.of("currentPassword", PASSWORD, "newPassword", NEW_PASSWORD))
                .expectStatus().isUnauthorized();
    }
}

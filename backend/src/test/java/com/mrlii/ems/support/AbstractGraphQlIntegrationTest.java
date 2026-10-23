package com.mrlii.ems.support;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.common.config.AdminProperties;
import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.notification.service.EmailService;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.concurrent.locks.LockSupport;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
/**
 * Base class for end-to-end tests over real HTTP: the full application on a random port,
 * PostgreSQL in a Testcontainer with the real Flyway migrations, and the seeded administrator.
 * <p>
 * Use {@link #graphQlTester()} for anonymous calls and {@link #adminGraphQlTester()} for calls
 * authenticated with a JWT obtained through the real {@code /api/v1/auth/login} endpoint.
 * Outgoing email is captured by a mocked {@link EmailService} (templates are still rendered).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class AbstractGraphQlIntegrationTest {

    protected static final String GRAPHQL_PATH = "/graphql";
    protected static final String AUTH_PATH = "/api/v1/auth";
    protected static final String ALLOWED_ORIGIN = "http://localhost:4200";

    private static final Pattern TOKEN_IN_LINK = Pattern.compile("set-password\\?token=([A-Za-z0-9_-]+)");

    @LocalServerPort
    protected int port;

    @Autowired
    protected AdminProperties adminProperties;

    @MockitoBean
    protected EmailService emailService;

    protected WebTestClient webTestClient() {
        return WebTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build();
    }

    protected HttpGraphQlTester graphQlTester() {
        WebTestClient client = webTestClient().mutate()
                .baseUrl("http://localhost:" + port + GRAPHQL_PATH)
                .build();
        return HttpGraphQlTester.create(client);
    }

    protected HttpGraphQlTester graphQlTester(String accessToken) {
        return graphQlTester().mutate()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .build();
    }

    protected HttpGraphQlTester adminGraphQlTester() {
        return graphQlTester(obtainAdminAccessToken());
    }

    protected WebTestClient.ResponseSpec login(String email, String password) {
        return webTestClient().post()
                .uri(AUTH_PATH + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new LoginRequest(email, password))
                .exchange();
    }

    protected WebTestClient.ResponseSpec loginAsAdmin() {
        return login(adminProperties.email(), adminProperties.password());
    }

    protected String obtainAdminAccessToken() {
        AuthResponse response = loginAsAdmin()
                .expectStatus().isOk()
                .expectBody(AuthResponse.class)
                .returnResult()
                .getResponseBody();
        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isNotBlank();
        return response.accessToken();
    }

    /** POST to a cookie-authenticated auth endpoint with the CSRF header and an allowed Origin. */
    protected WebTestClient.RequestHeadersSpec<?> cookiePost(String path, String refreshToken) {
        WebTestClient.RequestBodySpec spec = webTestClient().post()
                .uri(AUTH_PATH + path)
                .header("X-Requested-With", "ems-web")
                .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN);
        if (refreshToken != null) {
            spec.cookie("refresh_token", refreshToken);
        }
        return spec;
    }

    protected WebTestClient.ResponseSpec postJson(String path, Object body) {
        return webTestClient().post()
                .uri(AUTH_PATH + path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange();
    }

    /** Creates an employee through the real {@code createEmployee} mutation and returns its id. */
    protected Long createEmployee(String email, Long accessLevelId) {
        String accessLevel = accessLevelId == null ? "" : ", accessLevelId: " + accessLevelId;
        String id = adminGraphQlTester().document("""
                        mutation {
                          createEmployee(input: { firstName: "Esi", lastName: "Owusu", workEmail: "%s"%s }) { id }
                        }
                        """.formatted(email, accessLevel))
                .execute()
                .errors().verify()
                .path("createEmployee.id").entity(String.class).get();
        return Long.valueOf(id);
    }

    /** The welcome email sent to {@code email} (sent asynchronously after commit). */
    protected EmailRequest awaitWelcomeEmail(String email) {
        long deadline = System.currentTimeMillis() + 15_000;
        while (System.currentTimeMillis() < deadline) {
            List<EmailRequest> mine = Mockito.mockingDetails(emailService).getInvocations().stream()
                    .filter(invocation -> invocation.getMethod().getName().equals("send"))
                    .map(invocation -> (EmailRequest) invocation.getArgument(0))
                    .filter(request -> email.equals(request.to()))
                    .toList();
            if (!mine.isEmpty()) {
                return mine.getLast();
            }
            LockSupport.parkNanos(100_000_000L);
        }
        throw new AssertionError("No email sent to " + email);
    }

    /** Access token plus the raw refresh token from the {@code refresh_token} cookie. */
    protected record Session(String accessToken, String refreshToken) {}

    protected Session loginSession(String email, String password) {
        return toSession(login(email, password).expectStatus().isOk().expectBody(AuthResponse.class).returnResult());
    }

    protected Session refreshSession(String refreshToken) {
        return toSession(cookiePost("/refresh-token", refreshToken).exchange()
                .expectStatus().isOk().expectBody(AuthResponse.class).returnResult());
    }

    private static Session toSession(org.springframework.test.web.reactive.server.EntityExchangeResult<AuthResponse> result) {
        AuthResponse body = result.getResponseBody();
        org.springframework.http.ResponseCookie cookie = result.getResponseCookies().getFirst("refresh_token");
        assertThat(body).isNotNull();
        assertThat(cookie).isNotNull();
        return new Session(body.accessToken(), cookie.getValue());
    }

    protected static String uniqueEmail(String prefix) {
        return prefix + "-" + java.util.UUID.randomUUID().toString().substring(0, 8) + "@ems.test";
    }

    protected static String tokenFromEmail(EmailRequest email) {
        Matcher matcher = TOKEN_IN_LINK.matcher(email.textBody());
        assertThat(matcher.find()).as("set-password link in %s", email.textBody()).isTrue();
        return matcher.group(1);
    }

    /** Creates an employee, completes the welcome flow with {@code password} and returns the employee id. */
    protected Long onboardEmployee(String email, Long accessLevelId, String password) {
        Long id = createEmployee(email, accessLevelId);
        String token = tokenFromEmail(awaitWelcomeEmail(email));
        postJson("/set-password", Map.of("token", token, "newPassword", password))
                .expectStatus().isNoContent();
        return id;
    }
}

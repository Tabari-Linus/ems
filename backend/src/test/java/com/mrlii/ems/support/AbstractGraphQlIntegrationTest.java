package com.mrlii.ems.support;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.common.config.AdminProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Base class for end-to-end tests over real HTTP: the full application on a random port,
 * PostgreSQL in a Testcontainer with the real Flyway migrations, and the seeded administrator.
 * <p>
 * Use {@link #graphQlTester()} for anonymous calls and {@link #adminGraphQlTester()} for calls
 * authenticated with a JWT obtained through the real {@code /api/v1/auth/login} endpoint.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class AbstractGraphQlIntegrationTest {

    protected static final String GRAPHQL_PATH = "/graphql";
    protected static final String AUTH_PATH = "/api/v1/auth";

    @LocalServerPort
    protected int port;

    @Autowired
    protected AdminProperties adminProperties;

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

    protected HttpGraphQlTester adminGraphQlTester() {
        String token = obtainAdminAccessToken();
        return graphQlTester().mutate()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
    }

    protected WebTestClient.ResponseSpec loginAsAdmin() {
        return webTestClient().post()
                .uri(AUTH_PATH + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new LoginRequest(adminProperties.email(), adminProperties.password()))
                .exchange();
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
}

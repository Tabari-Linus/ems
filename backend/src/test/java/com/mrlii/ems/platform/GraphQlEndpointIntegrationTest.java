package com.mrlii.ems.platform;

import com.mrlii.ems.support.AbstractGraphQlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

class GraphQlEndpointIntegrationTest extends AbstractGraphQlIntegrationTest {

    private static final String GET_POSITIONS = """
            query {
              getPositions {
                totalElements
                currentPage
                data { id }
              }
            }
            """;

    @Test
    void graphQlRequest_withoutToken_isRejectedWith401() {
        webTestClient().post()
                .uri(GRAPHQL_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("query", GET_POSITIONS))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void admin_canQueryGetPositions_atGraphQlPath() {
        adminGraphQlTester().document(GET_POSITIONS)
                .execute()
                .errors().verify()
                .path("getPositions.totalElements").hasValue()
                .path("getPositions.currentPage").hasValue()
                .path("getPositions.data").hasValue();
    }

    @Test
    void graphQlEndpoint_isNoLongerServedAtRoot() {
        String token = obtainAdminAccessToken();

        webTestClient().post()
                .uri("/")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("query", GET_POSITIONS))
                .exchange()
                .expectStatus().is4xxClientError();
    }
}

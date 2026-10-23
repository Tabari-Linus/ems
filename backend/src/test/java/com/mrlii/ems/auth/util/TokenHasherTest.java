package com.mrlii.ems.auth.util;

import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TokenHasherTest {

    private final TokenHasher hasher = new TokenHasher();

    @Test
    void generate_is256RandomBitsBase64Url() {
        String token = hasher.generate();

        assertThat(token).matches("[A-Za-z0-9_-]{43}");
        assertThat(Base64.getUrlDecoder().decode(token)).hasSize(32);
    }

    @Test
    void generate_isUnique() {
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            tokens.add(hasher.generate());
        }
        assertThat(tokens).hasSize(1000);
    }

    @Test
    void hash_isDeterministicSha256Base64Url() {
        // SHA-256("abc") = ba7816bf...; base64url without padding
        assertThat(hasher.hash("abc")).isEqualTo("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0");
        assertThat(hasher.hash("abc")).isEqualTo(hasher.hash("abc"));
        assertThat(hasher.hash("abd")).isNotEqualTo(hasher.hash("abc"));
    }

    @Test
    void emailNormalizer_trimsAndLowerCases() {
        assertThat(EmailNormalizer.normalize("  Ama@Example.COM ")).isEqualTo("ama@example.com");
        assertThat(EmailNormalizer.normalize(null)).isNull();
    }
}

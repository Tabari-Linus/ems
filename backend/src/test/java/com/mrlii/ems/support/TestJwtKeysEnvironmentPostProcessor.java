package com.mrlii.ems.support;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;

/**
 * Supplies a throwaway RSA key pair (inline PEM) for {@code jwt.public-key} / {@code jwt.private-key}
 * to every Spring Boot test context, so tests need neither committed keys nor a {@code .keys/} dir.
 * Registered in {@code src/test/resources/META-INF/spring.factories}; it is on the test classpath only.
 */
public class TestJwtKeysEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "testJwtKeys";
    private static final KeyPair KEY_PAIR = generateKeyPair();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (environment.getPropertySources().contains(PROPERTY_SOURCE_NAME)) {
            return;
        }
        Map<String, Object> keys = Map.of(
                "jwt.public-key", toPem("PUBLIC KEY", KEY_PAIR.getPublic().getEncoded()),
                "jwt.private-key", toPem("PRIVATE KEY", KEY_PAIR.getPrivate().getEncoded()));
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, keys));
    }

    private static String toPem(String type, byte[] der) {
        String body = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(der);
        return "-----BEGIN " + type + "-----\n" + body + "\n-----END " + type + "-----\n";
    }

    private static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("RSA is not available in this JVM", e);
        }
    }
}

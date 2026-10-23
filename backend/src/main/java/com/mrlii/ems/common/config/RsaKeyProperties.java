package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

/**
 * JWT signing configuration.
 * <p>
 * {@code publicKey} / {@code privateKey} are converted by Spring Security's RSA key converter:
 * a value starting with {@code -----} is read as inline PEM content, anything else as a
 * resource location (e.g. {@code file:./.keys/jwt-public-key.pem}). See application.yaml.
 */
@ConfigurationProperties("jwt")
public record RsaKeyProperties(
        RSAPublicKey publicKey,
        RSAPrivateKey privateKey,
        long expirationMs,
        long refreshExpirationMs
    ) {}

package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("admin")
public record AdminProperties(String email, String password) {}

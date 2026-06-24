package com.mrlii.ems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("allowed.cors")
public record CorsProperties(String url) {}

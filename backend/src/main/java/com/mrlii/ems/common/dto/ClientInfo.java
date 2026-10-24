package com.mrlii.ems.common.dto;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;

/**
 * Where a request came from, recorded on sessions and audit events. The IP is the servlet remote
 * address, which the {@code prod} profile resolves from {@code X-Forwarded-For} behind the platform proxy.
 */
public record ClientInfo(String ip, String userAgent) {

    static final int MAX_IP_LENGTH = 64;
    static final int MAX_USER_AGENT_LENGTH = 512;

    public static final ClientInfo UNKNOWN = new ClientInfo(null, null);

    public ClientInfo {
        ip = truncate(ip, MAX_IP_LENGTH);
        userAgent = truncate(userAgent, MAX_USER_AGENT_LENGTH);
    }

    public static ClientInfo from(HttpServletRequest request) {
        return new ClientInfo(request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}

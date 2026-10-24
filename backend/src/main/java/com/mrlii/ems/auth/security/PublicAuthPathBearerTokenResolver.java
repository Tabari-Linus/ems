package com.mrlii.ems.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;

import java.util.Set;

/**
 * Ignores the {@code Authorization} header on the public auth endpoints. Clients often attach their
 * (possibly expired) access token to every call; on {@code /refresh-token} that would otherwise fail
 * bearer authentication with 401 before the refresh could happen.
 */
public class PublicAuthPathBearerTokenResolver implements BearerTokenResolver {

    static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/logout",
            "/api/v1/auth/set-password");

    private final BearerTokenResolver delegate = new DefaultBearerTokenResolver();

    @Override
    public String resolve(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (PUBLIC_PATHS.contains(path)) {
            return null;
        }
        return delegate.resolve(request);
    }
}

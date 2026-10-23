package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.common.config.CorsProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CSRF protection for the endpoints the browser authenticates with the ambient refresh cookie
 * ({@code refresh-token}, {@code logout}, {@code logout-all}). A request must carry
 * {@code X-Requested-With: ems-web} AND an {@code Origin} (or, failing that, a {@code Referer}) that
 * is in the CORS allow-list; otherwise it is rejected with 403 {@code CSRF_REJECTED}.
 * A cross-site form cannot set the custom header, and a cross-origin {@code fetch} that does is
 * preflighted and refused by CORS. Constructed by the security configuration (not a bean), so it runs
 * only inside the security filter chain.
 */
public class AuthCsrfFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Requested-With";
    public static final String HEADER_VALUE = "ems-web";

    static final Set<String> PROTECTED_PATHS = Set.of(
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/logout",
            "/api/v1/auth/logout-all");

    private final Set<String> allowedOrigins;
    private final AuthErrorResponseWriter errorWriter;

    public AuthCsrfFilter(CorsProperties corsProperties, AuthErrorResponseWriter errorWriter) {
        this.allowedOrigins = corsProperties.allowedOrigins().stream()
                .map(AuthCsrfFilter::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());
        this.errorWriter = errorWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !PROTECTED_PATHS.contains(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!HEADER_VALUE.equals(request.getHeader(HEADER_NAME))) {
            reject(response, "Missing or invalid " + HEADER_NAME + " header");
            return;
        }
        String origin = requestOrigin(request);
        if (origin == null || !allowedOrigins.contains(origin)) {
            reject(response, "Request origin is not allowed");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        errorWriter.write(response, HttpStatus.FORBIDDEN.value(), AuthErrorCode.CSRF_REJECTED, message);
    }

    static String requestOrigin(HttpServletRequest request) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin != null && !origin.isBlank() && !"null".equals(origin)) {
            return normalizeOrigin(origin);
        }
        String referer = request.getHeader(HttpHeaders.REFERER);
        if (referer == null || referer.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(referer.strip());
            if (uri.getScheme() == null || uri.getHost() == null) {
                return null;
            }
            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
            return normalizeOrigin(uri.getScheme() + "://" + uri.getHost() + port);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    static String normalizeOrigin(String origin) {
        String trimmed = origin.strip().toLowerCase(Locale.ROOT);
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }
}

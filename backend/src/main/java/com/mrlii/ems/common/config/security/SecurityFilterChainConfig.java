package com.mrlii.ems.common.config.security;

import com.mrlii.ems.auth.security.AccountJwtAuthenticationConverter;
import com.mrlii.ems.auth.security.AuthCsrfFilter;
import com.mrlii.ems.auth.security.AuthErrorResponseWriter;
import com.mrlii.ems.auth.security.JsonAccessDeniedHandler;
import com.mrlii.ems.auth.security.JsonAuthenticationEntryPoint;
import com.mrlii.ems.auth.security.PublicAuthPathBearerTokenResolver;
import com.mrlii.ems.common.config.CorsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityFilterChainConfig {

    private final JwtDecoder jwtDecoder;
    private final AccountJwtAuthenticationConverter accountJwtAuthenticationConverter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final CorsProperties corsProperties;
    private final AuthErrorResponseWriter authErrorResponseWriter;
    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
                // Bearer tokens are not ambient; the cookie endpoints use AuthCsrfFilter instead.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .addFilterBefore(new AuthCsrfFilter(corsProperties, authErrorResponseWriter),
                        BearerTokenAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh-token",
                                "/api/v1/auth/logout",
                                "/api/v1/auth/set-password").permitAll()
                        // Error dispatches keep their original status instead of becoming an empty 401.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health/**").permitAll()
                        // GraphiQL UI (enabled in dev only); the /graphql endpoint itself stays authenticated
                        .requestMatchers(HttpMethod.GET, "/graphiql", "/graphiql/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(new PublicAuthPathBearerTokenResolver())
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(accountJwtAuthenticationConverter)
                        )
                );
        return http.build();
    }
}

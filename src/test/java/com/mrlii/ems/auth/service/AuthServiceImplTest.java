package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.service.impl.AuthServiceImpl;
import com.mrlii.ems.common.config.RsaKeyProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtEncoder jwtEncoder;
    @Mock private RsaKeyProperties rsaKeyProperties;

    @InjectMocks private AuthServiceImpl authService;

    private static final String EMAIL = "user@example.com";
    private static final String RAW_PASSWORD = "secret";
    private static final String HASHED_PASSWORD = "$2a$10$hashed";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final long EXPIRATION_MS = 28_800_000L;

    private UserAccount enabledAccount;

    @BeforeEach
    void setUp() {
        enabledAccount = UserAccount.builder()
                .id(1L)
                .userId(USER_ID)
                .email(EMAIL)
                .passwordHash(HASHED_PASSWORD)
                .enabled(true)
                .build();
    }

    @Test
    void login_validCredentials_returnsAuthResponse() {
        when(userAccountRepository.findByEmailWithPermissions(EMAIL)).thenReturn(Optional.of(enabledAccount));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);

        Jwt jwt = Jwt.withTokenValue("signed.jwt.token")
                .header("alg", "RS256")
                .claim("sub", USER_ID.toString())
                .claim("permissions", java.util.List.of())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(EXPIRATION_MS))
                .build();
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

        AuthResponse response = authService.login(new LoginRequest(EMAIL, RAW_PASSWORD));

        assertThat(response.token()).isEqualTo("signed.jwt.token");
        assertThat(response.expiresAt()).isAfter(Instant.now());
    }

    @Test
    void login_unknownEmail_throws401() {
        when(userAccountRepository.findByEmailWithPermissions(EMAIL)).thenReturn(Optional.empty());

        var request = new LoginRequest(EMAIL, RAW_PASSWORD);
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void login_wrongPassword_throws401() {
        when(userAccountRepository.findByEmailWithPermissions(EMAIL)).thenReturn(Optional.of(enabledAccount));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(false);

        var request = new LoginRequest(EMAIL, RAW_PASSWORD);
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void login_disabledAccount_throws401() {
        UserAccount disabled = UserAccount.builder()
                .userId(USER_ID)
                .email(EMAIL)
                .passwordHash(HASHED_PASSWORD)
                .enabled(false)
                .build();
        when(userAccountRepository.findByEmailWithPermissions(EMAIL)).thenReturn(Optional.of(disabled));

        var request = new LoginRequest(EMAIL, RAW_PASSWORD);
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void login_accountWithNoEmployee_returnsEmptyPermissions() {
        when(userAccountRepository.findByEmailWithPermissions(EMAIL)).thenReturn(Optional.of(enabledAccount));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        when(rsaKeyProperties.expirationMs()).thenReturn(EXPIRATION_MS);

        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", USER_ID.toString())
                .claim("permissions", java.util.List.of())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(EXPIRATION_MS))
                .build();
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

        AuthResponse response = authService.login(new LoginRequest(EMAIL, RAW_PASSWORD));

        assertThat(response.token()).isNotBlank();
    }
}

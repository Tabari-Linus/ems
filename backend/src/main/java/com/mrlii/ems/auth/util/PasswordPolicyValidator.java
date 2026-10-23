package com.mrlii.ems.auth.util;

import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Password policy: 10–128 characters, must not contain the local part of the account email, and must
 * not be a commonly used password (bundled list {@code security/common-passwords.txt}, compared
 * case-insensitively). Hashing is BCrypt ({@code PasswordConfig}).
 */
@Component
public class PasswordPolicyValidator {

    public static final int MIN_LENGTH = 10;
    public static final int MAX_LENGTH = 128;
    static final int MIN_LOCAL_PART_LENGTH = 3;
    static final String COMMON_PASSWORDS = "security/common-passwords.txt";

    private final Set<String> commonPasswords;

    public PasswordPolicyValidator() {
        this(new ClassPathResource(COMMON_PASSWORDS));
    }

    PasswordPolicyValidator(Resource commonPasswordList) {
        this.commonPasswords = load(commonPasswordList);
    }

    /** Throws {@code PASSWORD_POLICY} (400) listing every rule the password breaks. */
    public void validate(String password, String email, String field) {
        List<Violation> violations = check(password, email, field);
        if (!violations.isEmpty()) {
            throw new AuthException(AuthErrorCode.PASSWORD_POLICY, HttpStatus.BAD_REQUEST,
                    "The password does not meet the password policy", violations);
        }
    }

    public List<Violation> check(String password, String email, String field) {
        List<Violation> violations = new ArrayList<>();
        if (password == null || password.isBlank()) {
            violations.add(new Violation(field, "Password is required"));
            return violations;
        }
        if (password.length() < MIN_LENGTH) {
            violations.add(new Violation(field, "Password must be at least " + MIN_LENGTH + " characters"));
        }
        if (password.length() > MAX_LENGTH) {
            violations.add(new Violation(field, "Password must be at most " + MAX_LENGTH + " characters"));
        }
        String lower = password.toLowerCase(Locale.ROOT);
        String localPart = localPart(email);
        if (localPart != null && lower.contains(localPart)) {
            violations.add(new Violation(field, "Password must not contain your email address"));
        }
        if (commonPasswords.contains(lower)) {
            violations.add(new Violation(field, "This password is too common. Choose something less predictable"));
        }
        return violations;
    }

    private static String localPart(String email) {
        if (email == null) {
            return null;
        }
        int at = email.indexOf('@');
        String local = (at < 0 ? email : email.substring(0, at)).strip().toLowerCase(Locale.ROOT);
        return local.length() >= MIN_LOCAL_PART_LENGTH ? local : null;
    }

    private static Set<String> load(Resource resource) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines()
                    .map(String::strip)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .map(line -> line.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toUnmodifiableSet());
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read the common-password list " + resource, e);
        }
    }
}

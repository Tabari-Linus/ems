package com.mrlii.ems.auth.util;

import com.mrlii.ems.auth.dto.Violation;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import com.mrlii.ems.auth.exception.AuthException;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyValidatorTest {

    private static final String EMAIL = "kwame.mensah@example.com";
    private final PasswordPolicyValidator validator = new PasswordPolicyValidator();

    private List<String> messages(String password) {
        return validator.check(password, EMAIL, "newPassword").stream().map(Violation::message).toList();
    }

    @Test
    void strongPassword_passes() {
        assertThat(messages("Blue-Kettle-Rain-17")).isEmpty();
        assertThatCode(() -> validator.validate("Blue-Kettle-Rain-17", EMAIL, "newPassword")).doesNotThrowAnyException();
    }

    @Test
    void blank_isRequired() {
        assertThat(messages("  ")).containsExactly("Password is required");
        assertThat(messages(null)).containsExactly("Password is required");
    }

    @Test
    void tooShort_isRejected() {
        assertThat(messages("Ab1-xyz")).anyMatch(m -> m.contains("at least 10"));
    }

    @Test
    void tooLong_isRejected() {
        assertThat(messages("a".repeat(129))).anyMatch(m -> m.contains("at most 128"));
    }

    @Test
    void exactBoundaries_pass() {
        assertThat(messages("Qx7!vbn#Lp")).isEmpty();
        assertThat(messages("Qx7!vbn#Lp".repeat(12) + "Qx7!vbn#")).isEmpty();
    }

    @Test
    void containingEmailLocalPart_isRejectedCaseInsensitively() {
        assertThat(messages("xx-KWAME.MENSAH-2026")).contains("Password must not contain your email address");
    }

    @Test
    void shortLocalPart_isNotChecked() {
        assertThat(validator.check("ab-Strong-Secret-1", "ab@example.com", "p")).isEmpty();
    }

    @Test
    void commonPassword_isRejectedCaseInsensitively() {
        assertThat(messages("Password123")).anyMatch(m -> m.contains("too common"));
        assertThat(messages("QWERTYUIOP")).anyMatch(m -> m.contains("too common"));
    }

    @Test
    void validate_throwsPasswordPolicyWithViolations() {
        assertThatThrownBy(() -> validator.validate("short", EMAIL, "newPassword"))
                .isInstanceOfSatisfying(AuthException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(AuthErrorCode.PASSWORD_POLICY);
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getViolations()).extracting(Violation::field).containsOnly("newPassword");
                });
    }

    @Test
    void customList_commentsAndBlankLinesIgnored() {
        PasswordPolicyValidator custom = new PasswordPolicyValidator(
                new ByteArrayResource("# comment\n\nCustomCommon1\n".getBytes()));

        assertThat(custom.check("customcommon1", null, "p")).hasSize(1);
        assertThat(custom.check("# comment", null, "p")).hasSize(1); // only too short, not "common"
    }

    @Test
    void unreadableList_failsFast() {
        Resource broken = new ByteArrayResource(new byte[0]) {
            @Override
            public InputStream getInputStream() throws IOException {
                throw new IOException("boom");
            }
        };

        assertThatThrownBy(() -> new PasswordPolicyValidator(broken)).isInstanceOf(UncheckedIOException.class);
    }
}

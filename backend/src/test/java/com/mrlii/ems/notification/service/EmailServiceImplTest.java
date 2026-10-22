package com.mrlii.ems.notification.service;

import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.notification.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock private JavaMailSender mailSender;

    private EmailServiceImpl emailService;

    private static final String FROM = "noreply@ems.com";

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender);
        ReflectionTestUtils.setField(emailService, "from", FROM);
    }

    // ── send ──────────────────────────────────────────────────────────────────

    @Test
    void sendValidRequestCallsMailSender() {
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        var request = new EmailRequest("to@example.com", "Subject", "<p>html</p>", "plain text");
        emailService.send(request);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendMailSenderThrowsPropagatesMailSendException() {
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        doThrow(new MailSendException("SMTP failure")).when(mailSender).send(any(MimeMessage.class));

        var request = new EmailRequest("to@example.com", "Subject", "<p>html</p>", "plain text");

        assertThatThrownBy(() -> emailService.send(request))
                .isInstanceOf(MailSendException.class);
    }

    @Test
    void sendUsesFromAddressFromConfiguration() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        var request = new EmailRequest("to@example.com", "Subject", "<p>html</p>", "plain text");
        emailService.send(request);

        verify(mailSender).send(any(MimeMessage.class));
    }
}

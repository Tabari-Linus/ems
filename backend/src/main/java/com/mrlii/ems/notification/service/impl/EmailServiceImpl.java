package com.mrlii.ems.notification.service.impl;

import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.notification.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    @Retryable(retryFor = MailException.class, maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2.0))
    public void send(EmailRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(request.to());
            helper.setSubject(request.subject());
            helper.setText(request.textBody(), request.htmlBody());
            mailSender.send(message);
            log.info("Email sent successfully to {}", request.to());
        } catch (MessagingException e) {
            throw new MailSendException("Failed to prepare email for " + request.to(), e);
        }
    }

    @Recover
    public void handleSendFailure(MailException ex, EmailRequest request) {
        log.error("Email delivery to {} failed after all retries: {}", request.to(), ex.getMessage());
    }
}

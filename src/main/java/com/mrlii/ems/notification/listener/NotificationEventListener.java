package com.mrlii.ems.notification.listener;

import com.mrlii.ems.notification.cache.NotificationDeduplicationCache;
import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.notification.enums.EmailTemplateType;
import com.mrlii.ems.notification.event.EmployeeCreatedEmailEvent;
import com.mrlii.ems.notification.service.EmailService;
import com.mrlii.ems.notification.template.EmailTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;
import java.util.concurrent.Executor;

@Component
@Slf4j
public class NotificationEventListener {

    private final EmailService emailService;
    private final EmailTemplateRenderer templateRenderer;
    private final NotificationDeduplicationCache deduplicationCache;
    private final Executor emailTaskExecutor;

    public NotificationEventListener(
            EmailService emailService,
            EmailTemplateRenderer templateRenderer,
            NotificationDeduplicationCache deduplicationCache,
            @Qualifier("emailTaskExecutor") Executor emailTaskExecutor) {
        this.emailService = emailService;
        this.templateRenderer = templateRenderer;
        this.deduplicationCache = deduplicationCache;
        this.emailTaskExecutor = emailTaskExecutor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmployeeCreated(EmployeeCreatedEmailEvent event) {
        emailTaskExecutor.execute(() -> sendWelcomeEmail(event));
    }

    private void sendWelcomeEmail(EmployeeCreatedEmailEvent event) {
        String dedupeKey = event.employeeId() + ":" + EmailTemplateType.EMPLOYEE_WELCOME.name();

        if (deduplicationCache.isDuplicate(dedupeKey)) {
            log.warn("Suppressing duplicate welcome email for employee id={}", event.employeeId());
            return;
        }
        deduplicationCache.markSent(dedupeKey);

        Map<String, Object> vars = Map.of(
                "email", event.email(),
                "temporaryPassword", event.temporaryPassword()
        );

        EmailRequest emailRequest = new EmailRequest(
                event.email(),
                EmailTemplateType.EMPLOYEE_WELCOME.getSubject(),
                templateRenderer.renderHtml(EmailTemplateType.EMPLOYEE_WELCOME, vars),
                templateRenderer.renderText(EmailTemplateType.EMPLOYEE_WELCOME, vars)
        );

        emailService.send(emailRequest);
    }
}

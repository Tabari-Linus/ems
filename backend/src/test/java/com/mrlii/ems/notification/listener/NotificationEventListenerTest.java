package com.mrlii.ems.notification.listener;

import com.mrlii.ems.notification.cache.NotificationDeduplicationCache;
import com.mrlii.ems.notification.dto.EmailRequest;
import com.mrlii.ems.notification.enums.EmailTemplateType;
import com.mrlii.ems.notification.event.EmployeeCreatedEmailEvent;
import com.mrlii.ems.notification.service.EmailService;
import com.mrlii.ems.notification.template.EmailTemplateRenderer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock private EmailService emailService;
    @Mock private EmailTemplateRenderer templateRenderer;
    @Mock private NotificationDeduplicationCache deduplicationCache;

    private NotificationEventListener listener;

    // Use a synchronous executor so async tasks run inline during tests
    private final Executor syncExecutor = Runnable::run;

    @BeforeEach
    void setUp() {
        listener = new NotificationEventListener(emailService, templateRenderer, deduplicationCache, syncExecutor);
    }

    // ── onEmployeeCreated ─────────────────────────────────────────────────────

    @Test
    void onEmployeeCreatedNewEventSendsWelcomeEmail() {
        var event = new EmployeeCreatedEmailEvent(1L, "alice@example.com", "tmp-pass");

        when(deduplicationCache.isDuplicate(anyString())).thenReturn(false);
        when(templateRenderer.renderHtml(eq(EmailTemplateType.EMPLOYEE_WELCOME), anyMap())).thenReturn("<html>body</html>");
        when(templateRenderer.renderText(eq(EmailTemplateType.EMPLOYEE_WELCOME), anyMap())).thenReturn("plain body");

        listener.onEmployeeCreated(event);

        ArgumentCaptor<EmailRequest> captor = ArgumentCaptor.forClass(EmailRequest.class);
        verify(emailService).send(captor.capture());
        EmailRequest sent = captor.getValue();

        assertThat(sent.to()).isEqualTo("alice@example.com");
        assertThat(sent.subject()).isEqualTo(EmailTemplateType.EMPLOYEE_WELCOME.getSubject());
        assertThat(sent.htmlBody()).isEqualTo("<html>body</html>");
        assertThat(sent.textBody()).isEqualTo("plain body");

        verify(deduplicationCache).markSent("1:" + EmailTemplateType.EMPLOYEE_WELCOME.name());
    }

    @Test
    void onEmployeeCreatedDuplicateEventSuppressesEmail() {
        var event = new EmployeeCreatedEmailEvent(1L, "alice@example.com", "tmp-pass");

        when(deduplicationCache.isDuplicate(anyString())).thenReturn(true);

        listener.onEmployeeCreated(event);

        verify(emailService, never()).send(any());
        verify(deduplicationCache, never()).markSent(any());
    }

    @Test
    void onEmployeeCreatedRendersTemplateWithCorrectVariables() {
        var event = new EmployeeCreatedEmailEvent(2L, "bob@example.com", "pass-xyz");

        when(deduplicationCache.isDuplicate(anyString())).thenReturn(false);
        when(templateRenderer.renderHtml(any(), anyMap())).thenReturn("html");
        when(templateRenderer.renderText(any(), anyMap())).thenReturn("text");

        listener.onEmployeeCreated(event);

        ArgumentCaptor<java.util.Map<String, Object>> varsCaptor = ArgumentCaptor.forClass(java.util.Map.class);
        verify(templateRenderer).renderHtml(eq(EmailTemplateType.EMPLOYEE_WELCOME), varsCaptor.capture());
        assertThat(varsCaptor.getValue())
                .containsEntry("email", "bob@example.com")
                .containsEntry("temporaryPassword", "pass-xyz");
    }

    // ── deduplication key format ──────────────────────────────────────────────

    @Test
    void onEmployeeCreatedDeduplicationKeyIncludesEmployeeIdAndTemplateType() {
        var event = new EmployeeCreatedEmailEvent(42L, "carol@example.com", "pw");

        when(deduplicationCache.isDuplicate(anyString())).thenReturn(false);
        when(templateRenderer.renderHtml(any(), anyMap())).thenReturn("html");
        when(templateRenderer.renderText(any(), anyMap())).thenReturn("text");

        listener.onEmployeeCreated(event);

        String expectedKey = "42:" + EmailTemplateType.EMPLOYEE_WELCOME.name();
        verify(deduplicationCache).isDuplicate(expectedKey);
        verify(deduplicationCache).markSent(expectedKey);
    }

    private static String anyString() {
        return any(String.class);
    }
}

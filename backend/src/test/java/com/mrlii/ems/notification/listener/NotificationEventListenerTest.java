package com.mrlii.ems.notification.listener;

import com.mrlii.ems.auth.dto.WelcomeLink;
import com.mrlii.ems.auth.service.OneTimeTokenService;
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

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    private static final String LINK = "http://localhost:4200/set-password?token=raw-token";

    @Mock private EmailService emailService;
    @Mock private EmailTemplateRenderer templateRenderer;
    @Mock private NotificationDeduplicationCache deduplicationCache;
    @Mock private OneTimeTokenService oneTimeTokenService;

    private NotificationEventListener listener;

    // Use a synchronous executor so async tasks run inline during tests
    private final Executor syncExecutor = Runnable::run;

    @BeforeEach
    void setUp() {
        listener = new NotificationEventListener(
                emailService, templateRenderer, deduplicationCache, syncExecutor, oneTimeTokenService);
    }

    private void stubLink(long accountId) {
        when(oneTimeTokenService.issueWelcomeLink(accountId))
                .thenReturn(new WelcomeLink(LINK, Instant.parse("2030-01-01T00:00:00Z"), 72));
    }

    private void stubRendering() {
        when(deduplicationCache.isDuplicate(any(String.class))).thenReturn(false);
        when(templateRenderer.renderHtml(eq(EmailTemplateType.EMPLOYEE_WELCOME), anyMap())).thenReturn("<html>body</html>");
        when(templateRenderer.renderText(eq(EmailTemplateType.EMPLOYEE_WELCOME), anyMap())).thenReturn("plain body");
    }

    @Test
    void onEmployeeCreatedNewEventSendsWelcomeEmail() {
        stubLink(10L);
        stubRendering();

        listener.onEmployeeCreated(new EmployeeCreatedEmailEvent(1L, 10L, "alice@example.com", "Alice"));

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
    void onEmployeeCreatedDuplicateEventSuppressesEmailAndIssuesNoToken() {
        when(deduplicationCache.isDuplicate(any(String.class))).thenReturn(true);

        listener.onEmployeeCreated(new EmployeeCreatedEmailEvent(1L, 10L, "alice@example.com", "Alice"));

        verify(emailService, never()).send(any());
        verify(deduplicationCache, never()).markSent(any());
        verifyNoInteractions(oneTimeTokenService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void onEmployeeCreatedRendersLinkAndNoPassword() {
        stubLink(20L);
        stubRendering();

        listener.onEmployeeCreated(new EmployeeCreatedEmailEvent(2L, 20L, "bob@example.com", "Bob"));

        ArgumentCaptor<Map<String, Object>> varsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(templateRenderer).renderHtml(eq(EmailTemplateType.EMPLOYEE_WELCOME), varsCaptor.capture());
        assertThat(varsCaptor.getValue())
                .containsEntry("email", "bob@example.com")
                .containsEntry("firstName", "Bob")
                .containsEntry("setPasswordUrl", LINK)
                .containsEntry("validForHours", 72L)
                .doesNotContainKey("temporaryPassword");
    }

    @Test
    void onEmployeeCreatedDeduplicationKeyIncludesEmployeeIdAndTemplateType() {
        stubLink(7L);
        stubRendering();

        listener.onEmployeeCreated(new EmployeeCreatedEmailEvent(42L, 7L, "carol@example.com", "Carol"));

        String expectedKey = "42:" + EmailTemplateType.EMPLOYEE_WELCOME.name();
        verify(deduplicationCache).isDuplicate(expectedKey);
        verify(deduplicationCache).markSent(expectedKey);
    }
}

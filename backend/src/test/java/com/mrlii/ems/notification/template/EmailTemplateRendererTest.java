package com.mrlii.ems.notification.template;

import com.mrlii.ems.notification.enums.EmailTemplateType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.context.IContext;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateRendererTest {

    @Mock private SpringTemplateEngine templateEngine;

    private EmailTemplateRenderer renderer;

    @BeforeEach
    void setUp() {
        renderer = new EmailTemplateRenderer(templateEngine);
    }

    @Test
    void renderHtmlCallsEngineWithHtmlTemplateName() {
        when(templateEngine.process(eq("employee-welcome.html"), any(IContext.class))).thenReturn("<html>welcome</html>");

        String result = renderer.renderHtml(EmailTemplateType.EMPLOYEE_WELCOME, Map.of("email", "a@b.com"));

        assertThat(result).isEqualTo("<html>welcome</html>");
        verify(templateEngine).process(eq("employee-welcome.html"), any(IContext.class));
    }

    @Test
    void renderTextCallsEngineWithTextTemplateName() {
        when(templateEngine.process(eq("employee-welcome.txt"), any(IContext.class))).thenReturn("plain text");

        String result = renderer.renderText(EmailTemplateType.EMPLOYEE_WELCOME, Map.of("email", "a@b.com"));

        assertThat(result).isEqualTo("plain text");
        verify(templateEngine).process(eq("employee-welcome.txt"), any(IContext.class));
    }

    @Test
    void renderHtmlPassesVariablesToContext() {
        when(templateEngine.process(any(String.class), any(IContext.class))).thenReturn("rendered");

        renderer.renderHtml(EmailTemplateType.EMPLOYEE_WELCOME, Map.of("email", "user@test.com", "temporaryPassword", "pw123"));

        verify(templateEngine).process(eq("employee-welcome.html"), any(IContext.class));
    }
}

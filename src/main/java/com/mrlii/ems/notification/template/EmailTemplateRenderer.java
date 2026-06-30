package com.mrlii.ems.notification.template;

import com.mrlii.ems.notification.enums.EmailTemplateType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Locale;
import java.util.Map;

@Component
public class EmailTemplateRenderer {

    private final SpringTemplateEngine templateEngine;

    public EmailTemplateRenderer(@Qualifier("emailTemplateEngine") SpringTemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String renderHtml(EmailTemplateType type, Map<String, Object> variables) {
        return templateEngine.process(type.getTemplateName() + ".html", buildContext(variables));
    }

    public String renderText(EmailTemplateType type, Map<String, Object> variables) {
        return templateEngine.process(type.getTemplateName() + ".txt", buildContext(variables));
    }

    private Context buildContext(Map<String, Object> variables) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariables(variables);
        return ctx;
    }
}

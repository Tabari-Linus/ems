package com.mrlii.ems.notification.enums;

import lombok.Getter;

@Getter
public enum EmailTemplateType {
    EMPLOYEE_WELCOME("employee-welcome", "Welcome to EMS – set up your account");

    private final String templateName;
    private final String subject;

    EmailTemplateType(String templateName, String subject) {
        this.templateName = templateName;
        this.subject = subject;
    }

}

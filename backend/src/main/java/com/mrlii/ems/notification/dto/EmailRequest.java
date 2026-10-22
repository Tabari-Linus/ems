package com.mrlii.ems.notification.dto;

public record EmailRequest(String to, String subject, String htmlBody, String textBody) {}

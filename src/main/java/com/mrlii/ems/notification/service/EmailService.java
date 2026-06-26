package com.mrlii.ems.notification.service;

import com.mrlii.ems.notification.dto.EmailRequest;

public interface EmailService {
    void send(EmailRequest request);
}

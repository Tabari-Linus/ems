package com.mrlii.ems.notification.event;

public record EmployeeCreatedEmailEvent(Long employeeId, String email, String temporaryPassword) {}

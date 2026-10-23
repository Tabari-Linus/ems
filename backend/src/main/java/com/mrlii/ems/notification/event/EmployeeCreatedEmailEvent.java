package com.mrlii.ems.notification.event;

/**
 * Published when an employee (and their password-less login account) was created. After commit the
 * notification module issues a WELCOME one-time token and emails the set-password link.
 */
public record EmployeeCreatedEmailEvent(Long employeeId, Long userAccountId, String email, String firstName) {}

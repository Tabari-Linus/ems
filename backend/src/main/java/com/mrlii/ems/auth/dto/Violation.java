package com.mrlii.ems.auth.dto;

/** One field-level problem in a 400 response. */
public record Violation(String field, String message) {}

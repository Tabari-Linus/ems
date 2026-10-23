package com.mrlii.ems.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** Body of every auth error: {@code {status, code, message, violations?}}. */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AuthErrorResponse(int status, String code, String message, List<Violation> violations) {

    public AuthErrorResponse(int status, String code, String message) {
        this(status, code, message, List.of());
    }
}

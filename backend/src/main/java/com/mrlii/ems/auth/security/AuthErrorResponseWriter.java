package com.mrlii.ems.auth.security;

import com.mrlii.ems.auth.dto.AuthErrorResponse;
import com.mrlii.ems.auth.enums.AuthErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Writes the auth error body from servlet filters / entry points, outside Spring MVC. */
@Component
@RequiredArgsConstructor
public class AuthErrorResponseWriter {

    private final JsonMapper jsonMapper;

    public void write(HttpServletResponse response, int status, AuthErrorCode code, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(jsonMapper.writeValueAsString(new AuthErrorResponse(status, code.name(), message)));
        response.getWriter().flush();
    }
}

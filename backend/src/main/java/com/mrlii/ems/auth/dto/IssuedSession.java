package com.mrlii.ems.auth.dto;

import com.mrlii.ems.auth.entity.AuthSession;

/** A freshly created session row together with the raw refresh token (returned once, never stored). */
public record IssuedSession(AuthSession session, String rawToken) {

    @Override
    public String toString() {
        return "IssuedSession[sessionId=" + session.getId() + ", rawToken=****]";
    }
}

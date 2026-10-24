package com.mrlii.ems.auth.security;

import lombok.Getter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Objects;
import java.util.UUID;

/**
 * A validated bearer token plus the account it was resolved to. Authorities come from the database
 * (via {@link AuthenticatedAccount}), never from token claims.
 */
@Getter
public class AccountAuthenticationToken extends JwtAuthenticationToken {

    /** Claim carrying the session family the access token was issued for. */
    public static final String SESSION_CLAIM = "sid";

    private final AuthenticatedAccount account;

    public AccountAuthenticationToken(Jwt jwt, AuthenticatedAccount account) {
        super(jwt, account.authorities(), jwt.getSubject());
        this.account = account;
    }

    /** The session family of this access token, or {@code null} if the token has none. */
    public UUID sessionFamilyId() {
        String sid = getToken().getClaimAsString(SESSION_CLAIM);
        if (sid == null) {
            return null;
        }
        try {
            return UUID.fromString(sid);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AccountAuthenticationToken that) || !super.equals(other)) {
            return false;
        }
        return Objects.equals(account, that.account);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), account);
    }
}

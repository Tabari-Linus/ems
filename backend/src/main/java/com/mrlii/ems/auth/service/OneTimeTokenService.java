package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.WelcomeLink;
import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;

import java.time.Instant;

/** Single-use, expiring, hashed tokens (D31) for welcome / set-password and reset links. */
public interface OneTimeTokenService {

    /**
     * Issues a token for {@code purpose}, invalidating the account's older unused tokens of the same
     * purpose. Returns the raw token; only its hash is stored. Never log the return value.
     */
    String issue(UserAccount account, OneTimeTokenPurpose purpose);

    /** Issues a WELCOME token for the account and builds the set-password link of the welcome email. */
    WelcomeLink issueWelcomeLink(Long userAccountId);

    /**
     * Looks up a raw token (row-locked) and checks it is unused and unexpired. Does not consume it.
     * Throws {@code TOKEN_INVALID} or {@code TOKEN_EXPIRED} (400).
     */
    OneTimeToken findRedeemable(String rawToken, Instant now);

    void markUsed(OneTimeToken token, Instant now);
}

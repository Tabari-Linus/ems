package com.mrlii.ems.auth.util;

import java.util.Locale;

/** Login emails are case-insensitive: they are trimmed and lower-cased before storage and lookup. */
public final class EmailNormalizer {

    private EmailNormalizer() {}

    public static String normalize(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}

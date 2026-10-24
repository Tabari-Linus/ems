package com.mrlii.ems.auth.dto;

import java.time.OffsetDateTime;

/** GraphQL {@code Account}: {@code id} is the account's public id. */
public record AccountResult(String id, String email, OffsetDateTime lastLoginAt) {}

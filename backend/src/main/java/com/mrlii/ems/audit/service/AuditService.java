package com.mrlii.ems.audit.service;

import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.common.dto.ClientInfo;

import java.util.Map;

public interface AuditService {

    String TARGET_USER_ACCOUNT = "USER_ACCOUNT";
    String TARGET_SESSION_FAMILY = "SESSION_FAMILY";

    /**
     * Records an audit event in the caller's transaction.
     *
     * @param actorAccountId the account that acted, or {@code null} when unknown (e.g. a failed login)
     * @param details        extra, non-secret context; never passwords or raw tokens
     */
    void record(AuditAction action, Long actorAccountId, String targetType, String targetId,
                ClientInfo client, Map<String, ?> details);

    /** Shorthand for an event whose target is the acting account itself. */
    default void recordForAccount(AuditAction action, Long accountId, ClientInfo client, Map<String, ?> details) {
        record(action, accountId, TARGET_USER_ACCOUNT, accountId == null ? null : accountId.toString(), client, details);
    }
}

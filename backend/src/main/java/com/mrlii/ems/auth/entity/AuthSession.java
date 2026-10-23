package com.mrlii.ems.auth.entity;

import com.mrlii.ems.auth.enums.SessionRevocationReason;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * One refresh-token generation of a device session. All generations of one login share a
 * {@code familyId}; rotation revokes the current row and points {@code replacedBy} at its successor.
 * Only the SHA-256 hash of the refresh token is stored.
 */
@Entity
@Table(name = "auth_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false, updatable = false)
    private UserAccount userAccount;

    @Column(nullable = false, updatable = false)
    private UUID familyId;

    @Column(nullable = false, unique = true, updatable = false)
    private String tokenHash;

    private String userAgent;

    private String ip;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant lastUsedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant revokedAt;

    @Enumerated(EnumType.STRING)
    private SessionRevocationReason revokedReason;

    private Long replacedBy;

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpiredAt(Instant now) {
        return !expiresAt.isAfter(now);
    }
}

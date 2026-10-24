package com.mrlii.ems.auth.entity;

import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** A single-use, expiring token (welcome / password reset). Only its SHA-256 hash is stored. */
@Entity
@Table(name = "one_time_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneTimeToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false, updatable = false)
    private UserAccount userAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private OneTimeTokenPurpose purpose;

    @Column(nullable = false, unique = true, updatable = false)
    private String tokenHash;

    @Column(nullable = false, updatable = false)
    private Instant expiresAt;

    private Instant usedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isExpiredAt(Instant now) {
        return !expiresAt.isAfter(now);
    }
}

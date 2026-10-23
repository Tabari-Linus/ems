package com.mrlii.ems.auth.entity;

import com.mrlii.ems.auth.util.EmailNormalizer;
import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.organization.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Login identity of an employee. {@code publicId} is the JWT subject and the id exposed to clients;
 * the numeric id never leaves the backend. {@code passwordHash} is {@code null} until the employee
 * sets a password through the welcome link.
 */
@Entity
@Table(name = "user_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    /** Always stored lower-case (see {@link EmailNormalizer}). */
    @Column(nullable = false, unique = true)
    private String email;

    private String passwordHash;

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private Instant lockedUntil;

    private Instant lastLoginAt;

    private Instant passwordChangedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    public boolean hasPassword() {
        return passwordHash != null && !passwordHash.isBlank();
    }

    public boolean isLockedAt(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    @PrePersist
    @PreUpdate
    void normalize() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID();
        }
        this.email = EmailNormalizer.normalize(this.email);
    }
}

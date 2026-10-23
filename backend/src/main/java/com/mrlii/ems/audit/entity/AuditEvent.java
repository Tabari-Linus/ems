package com.mrlii.ems.audit.entity;

import com.mrlii.ems.audit.enums.AuditAction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;

/**
 * One row of the security audit trail. {@code details} is a JSON object (jsonb); it never holds
 * passwords or raw tokens.
 */
@Entity
@Table(name = "audit_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant occurredAt;

    @Column(updatable = false)
    private Long actorAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private AuditAction action;

    @Column(updatable = false)
    private String targetType;

    @Column(updatable = false)
    private String targetId;

    @Column(updatable = false)
    private String ip;

    @Column(updatable = false)
    private String userAgent;

    @Column(columnDefinition = "jsonb", updatable = false)
    @ColumnTransformer(write = "?::jsonb")
    private String details;
}

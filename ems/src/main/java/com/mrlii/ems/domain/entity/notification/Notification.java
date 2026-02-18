package com.mrlii.ems.domain.entity.notification;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // The type of entity this notification relates to (e.g. "EMPLOYEE", "DOCUMENT")
    @Column(name = "reference_entity_type", length = 50)
    private String referenceEntityType;

    // The ID of the referenced entity
    @Column(name = "reference_entity_id")
    private UUID referenceEntityId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Builder
    public Notification(User user, NotificationType type, String title, String message,
                        String referenceEntityType, UUID referenceEntityId) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.referenceEntityType = referenceEntityType;
        this.referenceEntityId = referenceEntityId;
        this.read = false;
    }
}

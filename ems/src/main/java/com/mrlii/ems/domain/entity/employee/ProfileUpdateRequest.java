package com.mrlii.ems.domain.entity.employee;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.enums.ProfileUpdateStatus;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "profile_update_requests")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ProfileUpdateRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedByUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProfileUpdateStatus status = ProfileUpdateStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "requested_changes", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> requestedChanges;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    private User reviewedByUser;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Builder
    public ProfileUpdateRequest(Employee employee, User requestedByUser,
                                Map<String, Object> requestedChanges) {
        this.employee = employee;
        this.requestedByUser = requestedByUser;
        this.requestedChanges = requestedChanges;
        this.status = ProfileUpdateStatus.PENDING;
    }
}

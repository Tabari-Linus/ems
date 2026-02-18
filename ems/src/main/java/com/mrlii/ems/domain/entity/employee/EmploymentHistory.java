package com.mrlii.ems.domain.entity.employee;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.enums.EmploymentHistoryChangeType;
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

import java.time.LocalDate;

@Entity
@Table(name = "employment_history")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class EmploymentHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 40)
    private EmploymentHistoryChangeType changeType;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedByUser;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Builder
    public EmploymentHistory(Employee employee, EmploymentHistoryChangeType changeType,
                             String oldValue, String newValue, User changedByUser,
                             LocalDate effectiveDate, String notes) {
        this.employee = employee;
        this.changeType = changeType;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedByUser = changedByUser;
        this.effectiveDate = effectiveDate;
        this.notes = notes;
    }
}

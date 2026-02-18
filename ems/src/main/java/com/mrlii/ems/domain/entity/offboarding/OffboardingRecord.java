package com.mrlii.ems.domain.entity.offboarding;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.entity.checklist.EmployeeChecklist;
import com.mrlii.ems.domain.entity.employee.Employee;
import com.mrlii.ems.domain.enums.ExitReason;
import com.mrlii.ems.domain.enums.OffboardingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "offboarding_records")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class OffboardingRecord extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "exit_reason", nullable = false, length = 20)
    private ExitReason exitReason;

    @NotNull
    @Column(name = "last_working_day", nullable = false)
    private LocalDate lastWorkingDay;

    // Confidential — visible only to HR Manager and Super Admin
    @Column(name = "exit_interview_notes", columnDefinition = "TEXT")
    private String exitInterviewNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OffboardingStatus status = OffboardingStatus.INITIATED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_user_id", nullable = false)
    private User initiatedByUser;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_checklist_id")
    private EmployeeChecklist employeeChecklist;

    @Builder
    public OffboardingRecord(Employee employee, ExitReason exitReason,
                             LocalDate lastWorkingDay, User initiatedByUser,
                             EmployeeChecklist employeeChecklist) {
        this.employee = employee;
        this.exitReason = exitReason;
        this.lastWorkingDay = lastWorkingDay;
        this.initiatedByUser = initiatedByUser;
        this.employeeChecklist = employeeChecklist;
        this.status = OffboardingStatus.INITIATED;
    }
}

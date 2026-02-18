package com.mrlii.ems.domain.entity.checklist;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.enums.ChecklistTaskStatus;
import com.mrlii.ems.domain.enums.OwnerType;
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
import java.time.LocalDate;

@Entity
@Table(name = "employee_checklist_tasks")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class EmployeeChecklistTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_checklist_id", nullable = false)
    private EmployeeChecklist employeeChecklist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_task_id")
    private ChecklistTemplateTask templateTask;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_owner_type", nullable = false, length = 20)
    private OwnerType assignedOwnerType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedToUser;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "is_mandatory", nullable = false)
    private boolean mandatory = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChecklistTaskStatus status = ChecklistTaskStatus.PENDING;

    @Column(name = "completed_at")
    private Instant completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_user_id")
    private User completedByUser;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Builder
    public EmployeeChecklistTask(EmployeeChecklist employeeChecklist, ChecklistTemplateTask templateTask,
                                 String title, String description, OwnerType assignedOwnerType,
                                 User assignedToUser, LocalDate dueDate, boolean mandatory) {
        this.employeeChecklist = employeeChecklist;
        this.templateTask = templateTask;
        this.title = title;
        this.description = description;
        this.assignedOwnerType = assignedOwnerType;
        this.assignedToUser = assignedToUser;
        this.dueDate = dueDate;
        this.mandatory = mandatory;
        this.status = ChecklistTaskStatus.PENDING;
    }
}

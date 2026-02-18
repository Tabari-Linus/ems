package com.mrlii.ems.domain.entity.checklist;

import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.entity.employee.Employee;
import com.mrlii.ems.domain.enums.ChecklistStatus;
import com.mrlii.ems.domain.enums.ChecklistType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employee_checklists")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class EmployeeChecklist extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ChecklistTemplate template;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ChecklistType type;

    // hire_date for onboarding; last_working_day for offboarding
    @NotNull
    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChecklistStatus status = ChecklistStatus.IN_PROGRESS;

    @OneToMany(mappedBy = "employeeChecklist", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmployeeChecklistTask> tasks = new ArrayList<>();

    // ──────────────────────────────────────────────────────────
    // Bidirectional helper methods
    // ──────────────────────────────────────────────────────────

    public void addTask(EmployeeChecklistTask task) {
        tasks.add(task);
        task.setEmployeeChecklist(this);
    }

    public void removeTask(EmployeeChecklistTask task) {
        tasks.remove(task);
        task.setEmployeeChecklist(null);
    }

    // ──────────────────────────────────────────────────────────
    // Builder
    // ──────────────────────────────────────────────────────────

    @Builder
    public EmployeeChecklist(Employee employee, ChecklistTemplate template,
                             ChecklistType type, LocalDate referenceDate) {
        this.employee = employee;
        this.template = template;
        this.type = type;
        this.referenceDate = referenceDate;
        this.status = ChecklistStatus.IN_PROGRESS;
    }
}

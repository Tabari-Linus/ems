package com.mrlii.ems.domain.entity.checklist;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.entity.organization.Department;
import com.mrlii.ems.domain.entity.organization.EmploymentType;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "checklist_templates")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ChecklistTemplate extends BaseEntity {

    @NotBlank
    @Size(max = 150)
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ChecklistType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicable_employment_type_id")
    private EmploymentType applicableEmploymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicable_department_id")
    private Department applicableDepartment;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @OneToMany(mappedBy = "template", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistTemplateTask> tasks = new ArrayList<>();

    // ──────────────────────────────────────────────────────────
    // Bidirectional helper methods
    // ──────────────────────────────────────────────────────────

    public void addTask(ChecklistTemplateTask task) {
        tasks.add(task);
        task.setTemplate(this);
    }

    public void removeTask(ChecklistTemplateTask task) {
        tasks.remove(task);
        task.setTemplate(null);
    }

    // ──────────────────────────────────────────────────────────
    // Builder
    // ──────────────────────────────────────────────────────────

    @Builder
    public ChecklistTemplate(String name, String description, ChecklistType type,
                             EmploymentType applicableEmploymentType,
                             Department applicableDepartment, User createdByUser) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.applicableEmploymentType = applicableEmploymentType;
        this.applicableDepartment = applicableDepartment;
        this.createdByUser = createdByUser;
        this.active = true;
    }
}

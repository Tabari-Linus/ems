package com.mrlii.ems.domain.entity.checklist;

import com.mrlii.ems.domain.entity.base.BaseEntity;
import com.mrlii.ems.domain.enums.OwnerType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "checklist_template_tasks")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ChecklistTemplateTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ChecklistTemplate template;

    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_owner_type", nullable = false, length = 20)
    private OwnerType assignedOwnerType;

    @Min(0)
    @Column(name = "due_date_offset_days", nullable = false)
    private int dueDateOffsetDays;

    @Column(name = "is_mandatory", nullable = false)
    private boolean mandatory = true;

    @Min(0)
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Builder
    public ChecklistTemplateTask(ChecklistTemplate template, String title, String description,
                                 OwnerType assignedOwnerType, int dueDateOffsetDays,
                                 boolean mandatory, int sortOrder) {
        this.template = template;
        this.title = title;
        this.description = description;
        this.assignedOwnerType = assignedOwnerType;
        this.dueDateOffsetDays = dueDateOffsetDays;
        this.mandatory = mandatory;
        this.sortOrder = sortOrder;
    }
}

package com.mrlii.ems.domain.entity.organization;

import com.mrlii.ems.domain.entity.base.SoftDeletableEntity;
import com.mrlii.ems.domain.enums.GradeLevel;
import com.mrlii.ems.domain.enums.JobRoleStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_roles")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class JobRole extends SoftDeletableEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    // Immutable after creation — unique business key, never changed (US-403)
    @Setter(AccessLevel.NONE)
    @NotBlank
    @Size(max = 20)
    @Column(name = "code", nullable = false, unique = true, length = 20, updatable = false)
    private String code;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "grade_level", nullable = false, length = 20)
    private GradeLevel gradeLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_department_id")
    private Department defaultDepartment;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_managerial", nullable = false)
    private boolean managerial = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JobRoleStatus status = JobRoleStatus.ACTIVE;

    @Builder
    public JobRole(String title, String code, GradeLevel gradeLevel,
                   Department defaultDepartment, String description,
                   boolean managerial, JobRoleStatus status) {
        this.title = title;
        this.code = code;
        this.gradeLevel = gradeLevel;
        this.defaultDepartment = defaultDepartment;
        this.description = description;
        this.managerial = managerial;
        this.status = status != null ? status : JobRoleStatus.ACTIVE;
    }
}

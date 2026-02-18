package com.mrlii.ems.domain.entity.organization;

import com.mrlii.ems.domain.entity.base.SoftDeletableEntity;
import com.mrlii.ems.domain.entity.employee.Employee;
import com.mrlii.ems.domain.enums.DepartmentStatus;
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
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class Department extends SoftDeletableEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    // Immutable after creation — unique business key, never changed (US-303)
    @Setter(AccessLevel.NONE)
    @NotBlank
    @Size(max = 20)
    @Column(name = "code", nullable = false, unique = true, length = 20, updatable = false)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    // FK added after employees table is created (circular reference)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_head_id")
    private Employee departmentHead;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DepartmentStatus status = DepartmentStatus.ACTIVE;

    @OneToMany(mappedBy = "parentDepartment", fetch = FetchType.LAZY)
    private List<Department> childDepartments = new ArrayList<>();

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Employee> employees = new ArrayList<>();

    // ──────────────────────────────────────────────────────────
    // Bidirectional helper methods
    // ──────────────────────────────────────────────────────────

    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.setDepartment(this);
    }

    public void removeEmployee(Employee employee) {
        employees.remove(employee);
        employee.setDepartment(null);
    }

    public void addChildDepartment(Department department) {
        childDepartments.add(department);
        department.setParentDepartment(this);
    }

    public void removeChildDepartment(Department department) {
        childDepartments.remove(department);
        department.setParentDepartment(null);
    }

    // ──────────────────────────────────────────────────────────
    // Builder
    // ──────────────────────────────────────────────────────────

    @Builder
    public Department(String name, String code, String description,
                      Department parentDepartment, Employee departmentHead,
                      DepartmentStatus status) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.parentDepartment = parentDepartment;
        this.departmentHead = departmentHead;
        this.status = status != null ? status : DepartmentStatus.ACTIVE;
    }
}

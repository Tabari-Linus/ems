package com.mrlii.ems.organization.employee.entity;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.department.entity.Department;
import com.mrlii.ems.organization.position.entity.Position;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends AuditableEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(unique = true)
    private String workEmail;

    @Enumerated(EnumType.STRING)
    private CommonStatus status;

    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL)
    private EmployeeBio bio;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL)
    private EmployeeContact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private EmployeeAddress address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "identification_id")
    private EmployeeIdentification identification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_level_id")
    private AccessLevel accessLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;
}

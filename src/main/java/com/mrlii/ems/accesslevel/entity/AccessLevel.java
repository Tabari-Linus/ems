package com.mrlii.ems.accesslevel.entity;

import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "access_levels")
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class AccessLevel extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String accessLevelName;

    private String description;

    @OneToMany(mappedBy = "accessLevel", fetch = FetchType.LAZY)
    private Set<PermissionSet> permissions;

    @Enumerated(EnumType.STRING)
    private CommonStatus status;

    @OneToMany(mappedBy = "accessLevel", fetch = FetchType.LAZY)
    private List<Employee> employees;

    private LocalDateTime deletedAt;
}

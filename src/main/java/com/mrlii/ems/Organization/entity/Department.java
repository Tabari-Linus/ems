package com.mrlii.ems.Organization.entity;

import com.mrlii.ems.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department")
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class Department extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String departmentName;

    @Column(unique = true)
    private String departmentCode;

    @Column(unique = true)
    private String departmentPrefix;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_id")
    private Office office;
}

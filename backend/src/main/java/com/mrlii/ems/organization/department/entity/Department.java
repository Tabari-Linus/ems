package com.mrlii.ems.organization.department.entity;

import com.mrlii.ems.organization.office.entity.Office;
import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    private String departmentPrefix;

    private String departmentEmail;

    private String departmentPhoneNumber;

    private String departmentAddress;

    @Enumerated(EnumType.STRING)
    private CommonStatus departmentStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_id")
    private Office office;

    private LocalDateTime deletedAt;
}

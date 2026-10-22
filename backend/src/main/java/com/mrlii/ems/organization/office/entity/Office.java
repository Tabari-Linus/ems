package com.mrlii.ems.organization.office.entity;

import com.mrlii.ems.organization.company.entity.Company;
import com.mrlii.ems.organization.department.entity.Department;
import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "office")
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class Office extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String officeName;

    @Column(unique = true)
    private String officeCode;

    @Column(unique = true)
    private String officeEmail;

    @Column(unique = true)
    private String officePhoneNumber;

    private String officeAddress;

    @Enumerated(EnumType.STRING)
    private CommonStatus officeStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @OneToMany(mappedBy = "office", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Department> departments;

    private LocalDateTime deletedAt;

}

package com.mrlii.ems.Organization.entity;

import com.mrlii.ems.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @OneToMany(mappedBy = "office", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Department> departments;

}

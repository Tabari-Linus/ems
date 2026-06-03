package com.mrlii.ems.Organization.entity;

import com.mrlii.ems.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "company")
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class Company extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;

    @Column(unique = true)
    private String companyCode;

    @Column(unique = true)

    private String companyEmail;

    private String companyPhoneNumber;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Office> offices;

    private Long nextOfficeNumber = 1L;
}

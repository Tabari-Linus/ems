package com.mrlii.ems.Organization.company.entity;

import com.mrlii.ems.Organization.office.entity.Office;
import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
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

    private String companyCode;

    private String companyEmail;

    private String companyPhoneNumber;

    private String companyAddress;

    @Enumerated(EnumType.STRING)
    private CommonStatus companyStatus;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Office> offices;

    private Long nextOfficeNumber;

    private LocalDateTime deletedAt;

    @PrePersist
    private void prePersist() {
        if (this.nextOfficeNumber == null) {
            this.nextOfficeNumber = 1L;
        }
    }
}

package com.mrlii.ems.organization.employee.entity;

import com.mrlii.ems.organization.employee.enums.IdentificationType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_identifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeIdentification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String identificationNumber;

    @Enumerated(EnumType.STRING)
    private IdentificationType identificationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
}

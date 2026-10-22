package com.mrlii.ems.organization.employee.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private String street;

    private String city;

    private String state;

    private String zipCode;

    private String country;

    private String digitalAddress;

    private Boolean isCurrentAddress;

}

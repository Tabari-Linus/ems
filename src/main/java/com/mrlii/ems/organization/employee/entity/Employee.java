package com.mrlii.ems.organization.employee.entity;

import com.mrlii.ems.accesslevel.entity.AccessLevel;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    private String workEmail;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private EmployeeBio bio;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private EmployeeContact contact;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private EmployeeAddress address;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private EmployeeIdentification identification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_level_id")
    private AccessLevel accessLevel;
}

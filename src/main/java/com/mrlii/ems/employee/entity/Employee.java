package com.mrlii.ems.employee.entity;

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

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL)
    private EmployeeBio bio;


}

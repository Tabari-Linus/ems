package com.mrlii.ems.organization.employee.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private String fullName;

    private String otherName;

    private String gender;

    private String nationality;

    private String maritalStatus;

    private String dateOfBirth;

    private String placeOfBirth;

    private String profilePicture;

    private LocalDateTime dateHired;

    private String isExpert;

}

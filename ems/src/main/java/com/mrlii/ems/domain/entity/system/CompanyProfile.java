package com.mrlii.ems.domain.entity.system;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "company_profile")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class CompanyProfile extends BaseEntity {

    @NotBlank
    @Size(max = 200)
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Email
    @Size(max = 255)
    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    // Employee ID auto-generation config (e.g. prefix="EMP", padding=4 → EMP-0042)
    @NotBlank
    @Size(max = 10)
    @Column(name = "employee_id_prefix", nullable = false, length = 10)
    private String employeeIdPrefix = "EMP";

    @Min(1)
    @Column(name = "employee_id_padding", nullable = false)
    private int employeeIdPadding = 4;

    @Column(name = "employee_id_current_sequence", nullable = false)
    private int employeeIdCurrentSequence = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedByUser;

    @Builder
    public CompanyProfile(String companyName, String logoUrl, String address,
                          String registrationNumber, String contactEmail,
                          String employeeIdPrefix, int employeeIdPadding) {
        this.companyName = companyName;
        this.logoUrl = logoUrl;
        this.address = address;
        this.registrationNumber = registrationNumber;
        this.contactEmail = contactEmail;
        this.employeeIdPrefix = employeeIdPrefix != null ? employeeIdPrefix : "EMP";
        this.employeeIdPadding = employeeIdPadding > 0 ? employeeIdPadding : 4;
        this.employeeIdCurrentSequence = 0;
    }
}

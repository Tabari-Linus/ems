package com.mrlii.ems.domain.entity.document;

import com.mrlii.ems.domain.entity.auth.User;
import com.mrlii.ems.domain.entity.base.SoftDeletableEntity;
import com.mrlii.ems.domain.entity.employee.Employee;
import com.mrlii.ems.domain.enums.DocumentStatus;
import com.mrlii.ems.domain.enums.DocumentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "employee_documents")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class EmployeeDocument extends SoftDeletableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocumentType documentType;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank
    @Size(max = 500)
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "is_visible_to_employee", nullable = false)
    private boolean visibleToEmployee = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private User uploadedByUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DocumentStatus status = DocumentStatus.PENDING_REVIEW;

    @Builder
    public EmployeeDocument(Employee employee, DocumentType documentType, String name,
                            String fileUrl, Long fileSizeBytes, String mimeType,
                            LocalDate expiryDate, boolean visibleToEmployee, User uploadedByUser) {
        this.employee = employee;
        this.documentType = documentType;
        this.name = name;
        this.fileUrl = fileUrl;
        this.fileSizeBytes = fileSizeBytes;
        this.mimeType = mimeType;
        this.expiryDate = expiryDate;
        this.visibleToEmployee = visibleToEmployee;
        this.uploadedByUser = uploadedByUser;
        this.status = DocumentStatus.PENDING_REVIEW;
    }
}

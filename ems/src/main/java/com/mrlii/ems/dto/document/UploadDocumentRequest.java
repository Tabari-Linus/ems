package com.mrlii.ems.dto.document;

import com.mrlii.ems.domain.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

// Metadata only — the actual file is sent as a MultipartFile in the same multipart request
public record UploadDocumentRequest(

        @NotNull
        DocumentType documentType,

        @NotBlank
        @Size(max = 200)
        String name,

        LocalDate expiryDate,

        boolean visibleToEmployee

) {}

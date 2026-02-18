package com.mrlii.ems.dto.offboarding;

import jakarta.validation.constraints.NotBlank;

public record RecordExitInterviewRequest(

        @NotBlank
        String notes

) {}

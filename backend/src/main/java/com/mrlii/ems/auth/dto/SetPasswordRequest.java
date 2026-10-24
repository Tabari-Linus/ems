package com.mrlii.ems.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetPasswordRequest(
        @NotBlank @Size(max = 128) String token,
        @NotBlank String newPassword
) {
    @Override
    public String toString() {
        return "SetPasswordRequest[token=****, newPassword=****]";
    }
}

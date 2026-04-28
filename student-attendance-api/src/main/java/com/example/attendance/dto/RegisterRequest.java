package com.example.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 64)
        @Pattern(
                regexp = "^[a-zA-Z0-9_.-]+$",
                message = "Username may only contain letters, digits, underscore, dot or dash"
        )
        String username,

        @NotBlank @Size(min = 6, max = 100) String password,

        @NotBlank @Size(min = 1, max = 120) String displayName
) {
}

package com.example.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank @Size(max = 80) String authorName,
        @NotBlank @Size(max = 2000) String content
) {
}

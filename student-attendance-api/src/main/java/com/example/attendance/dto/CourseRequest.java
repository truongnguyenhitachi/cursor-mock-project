package com.example.attendance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank @Size(max = 32) String courseCode,
        @NotBlank @Size(max = 160) String name,
        @Size(max = 500) String description,
        @NotNull @Min(0) Integer credits
) {
}

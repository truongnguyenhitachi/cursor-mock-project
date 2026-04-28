package com.example.attendance.dto;

import com.example.attendance.domain.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AttendanceRequest(
        @NotNull Long studentId,
        @NotNull Long courseId,
        @NotNull LocalDate sessionDate,
        @NotNull AttendanceStatus status,
        @Size(max = 255) String remarks
) {
}

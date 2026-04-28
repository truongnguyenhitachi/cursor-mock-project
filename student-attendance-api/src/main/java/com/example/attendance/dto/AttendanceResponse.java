package com.example.attendance.dto;

import com.example.attendance.domain.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceResponse(
        Long id,
        Long studentId,
        String studentCode,
        Long courseId,
        String courseCode,
        LocalDate sessionDate,
        AttendanceStatus status,
        String remarks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

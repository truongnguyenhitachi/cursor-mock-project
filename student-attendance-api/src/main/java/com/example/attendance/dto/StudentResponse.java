package com.example.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record StudentResponse(
        Long id,
        String studentCode,
        String firstName,
        String lastName,
        String email,
        LocalDate dateOfBirth,
        Set<CourseSummary> courses,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record CourseSummary(Long id, String courseCode, String name) {}
}

package com.example.attendance.dto;

import java.time.LocalDateTime;

public record CourseResponse(
        Long id,
        String courseCode,
        String name,
        String description,
        Integer credits,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

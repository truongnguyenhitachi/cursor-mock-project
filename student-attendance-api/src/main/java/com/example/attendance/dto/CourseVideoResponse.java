package com.example.attendance.dto;

import java.time.LocalDateTime;

public record CourseVideoResponse(
        Long id,
        Long courseId,
        String title,
        String description,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String streamUrl,
        String downloadUrl,
        LocalDateTime uploadedAt,
        LocalDateTime updatedAt
) {
}

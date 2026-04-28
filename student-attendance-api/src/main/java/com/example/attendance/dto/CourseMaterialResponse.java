package com.example.attendance.dto;

import java.time.LocalDateTime;

public record CourseMaterialResponse(
        Long id,
        Long courseId,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String downloadUrl,
        LocalDateTime uploadedAt
) {
}

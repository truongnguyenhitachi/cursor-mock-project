package com.example.attendance.dto;

import java.time.LocalDateTime;

public record CourseResponse(
        Long id,
        String courseCode,
        String name,
        String description,
        Integer credits,
        boolean hasCoverImage,
        String coverImageUrl,
        long likeCount,
        long commentCount,
        long materialCount,
        boolean likedByMe,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

package com.example.attendance.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long courseId,
        String authorName,
        String content,
        long likeCount,
        boolean likedByMe,
        boolean ownedByMe,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

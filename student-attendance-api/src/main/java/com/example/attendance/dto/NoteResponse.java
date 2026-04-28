package com.example.attendance.dto;

import java.time.LocalDateTime;

public record NoteResponse(
        Long id,
        Long userId,
        Long courseId,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

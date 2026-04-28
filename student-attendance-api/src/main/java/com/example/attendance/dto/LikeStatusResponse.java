package com.example.attendance.dto;

public record LikeStatusResponse(
        long likeCount,
        boolean likedByMe
) {
}

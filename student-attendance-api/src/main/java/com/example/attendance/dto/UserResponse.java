package com.example.attendance.dto;

import com.example.attendance.domain.UserRole;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String displayName,
        UserRole role,
        LocalDateTime createdAt
) {
}

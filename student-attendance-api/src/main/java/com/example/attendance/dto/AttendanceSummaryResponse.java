package com.example.attendance.dto;

import com.example.attendance.domain.AttendanceStatus;

import java.util.Map;

public record AttendanceSummaryResponse(
        Long studentId,
        Long courseId,
        long totalSessions,
        Map<AttendanceStatus, Long> counts
) {
}

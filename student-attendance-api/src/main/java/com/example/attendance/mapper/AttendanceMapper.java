package com.example.attendance.mapper;

import com.example.attendance.domain.Attendance;
import com.example.attendance.dto.AttendanceResponse;

public final class AttendanceMapper {

    private AttendanceMapper() {}

    public static AttendanceResponse toResponse(Attendance attendance) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getStudent().getId(),
                attendance.getStudent().getStudentCode(),
                attendance.getCourse().getId(),
                attendance.getCourse().getCourseCode(),
                attendance.getSessionDate(),
                attendance.getStatus(),
                attendance.getRemarks(),
                attendance.getCreatedAt(),
                attendance.getUpdatedAt()
        );
    }
}

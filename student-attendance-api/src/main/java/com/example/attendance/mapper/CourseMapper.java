package com.example.attendance.mapper;

import com.example.attendance.domain.Course;
import com.example.attendance.dto.CourseResponse;

public final class CourseMapper {

    private CourseMapper() {}

    public static CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCourseCode(),
                course.getName(),
                course.getDescription(),
                course.getCredits(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}

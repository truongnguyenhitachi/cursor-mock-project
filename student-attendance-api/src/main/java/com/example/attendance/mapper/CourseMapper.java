package com.example.attendance.mapper;

import com.example.attendance.domain.Course;
import com.example.attendance.dto.CourseResponse;

public final class CourseMapper {

    private CourseMapper() {}

    public static CourseResponse toResponse(Course course) {
        return toResponse(course, new CourseStats(0, 0, 0, false));
    }

    public static CourseResponse toResponse(Course course, CourseStats stats) {
        boolean hasCover = course.getCoverImagePath() != null
                && !course.getCoverImagePath().isBlank();
        return new CourseResponse(
                course.getId(),
                course.getCourseCode(),
                course.getName(),
                course.getDescription(),
                course.getCredits(),
                hasCover,
                hasCover ? "/courses/" + course.getId() + "/cover" : null,
                stats.likeCount(),
                stats.commentCount(),
                stats.materialCount(),
                stats.likedByMe(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    public record CourseStats(
            long likeCount,
            long commentCount,
            long materialCount,
            boolean likedByMe
    ) {}
}

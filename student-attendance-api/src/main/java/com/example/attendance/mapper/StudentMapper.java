package com.example.attendance.mapper;

import com.example.attendance.domain.Student;
import com.example.attendance.dto.StudentResponse;

import java.util.Set;
import java.util.stream.Collectors;

public final class StudentMapper {

    private StudentMapper() {}

    public static StudentResponse toResponse(Student student) {
        Set<StudentResponse.CourseSummary> courses = student.getCourses() == null
                ? Set.of()
                : student.getCourses().stream()
                    .map(c -> new StudentResponse.CourseSummary(c.getId(), c.getCourseCode(), c.getName()))
                    .collect(Collectors.toUnmodifiableSet());

        return new StudentResponse(
                student.getId(),
                student.getStudentCode(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getDateOfBirth(),
                courses,
                student.getCreatedAt(),
                student.getUpdatedAt()
        );
    }
}

package com.example.attendance.web;

import com.example.attendance.dto.CourseResponse;
import com.example.attendance.service.MyCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/me/courses")
@RequiredArgsConstructor
public class MyCoursesController {

    private final MyCourseService myCourseService;

    @GetMapping
    public List<CourseResponse> list() {
        return myCourseService.myCourses();
    }

    @GetMapping("/{courseId}/enrollment")
    public Map<String, Boolean> enrollmentStatus(@PathVariable Long courseId) {
        return Map.of("enrolled", myCourseService.isEnrolled(courseId));
    }

    @PostMapping("/{courseId}")
    public CourseResponse enroll(@PathVariable Long courseId) {
        return myCourseService.enroll(courseId);
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> unenroll(@PathVariable Long courseId) {
        myCourseService.unenroll(courseId);
        return ResponseEntity.noContent().build();
    }
}

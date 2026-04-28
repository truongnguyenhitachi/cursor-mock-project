package com.example.attendance.service;

import com.example.attendance.domain.Course;
import com.example.attendance.dto.CourseRequest;
import com.example.attendance.dto.CourseResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.mapper.CourseMapper;
import com.example.attendance.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseResponse create(CourseRequest request) {
        if (courseRepository.existsByCourseCode(request.courseCode())) {
            throw new ConflictException("Course code already exists: " + request.courseCode());
        }

        Course course = Course.builder()
                .courseCode(request.courseCode())
                .name(request.name())
                .description(request.description())
                .credits(request.credits())
                .build();

        return CourseMapper.toResponse(courseRepository.save(course));
    }

    public CourseResponse update(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Course", id));

        if (!course.getCourseCode().equals(request.courseCode())
                && courseRepository.existsByCourseCode(request.courseCode())) {
            throw new ConflictException("Course code already exists: " + request.courseCode());
        }

        course.setCourseCode(request.courseCode());
        course.setName(request.name());
        course.setDescription(request.description());
        course.setCredits(request.credits());

        return CourseMapper.toResponse(course);
    }

    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw NotFoundException.of("Course", id);
        }
        courseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CourseResponse get(Long id) {
        return courseRepository.findById(id)
                .map(CourseMapper::toResponse)
                .orElseThrow(() -> NotFoundException.of("Course", id));
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> list(Pageable pageable) {
        return courseRepository.findAll(pageable).map(CourseMapper::toResponse);
    }
}

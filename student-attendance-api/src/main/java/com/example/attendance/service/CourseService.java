package com.example.attendance.service;

import com.example.attendance.domain.Course;
import com.example.attendance.dto.CourseRequest;
import com.example.attendance.dto.CourseResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.mapper.CourseMapper;
import com.example.attendance.repository.CommentLikeRepository;
import com.example.attendance.repository.CommentRepository;
import com.example.attendance.repository.CourseLikeRepository;
import com.example.attendance.repository.CourseMaterialRepository;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.CourseVideoRepository;
import com.example.attendance.repository.NoteRepository;
import com.example.attendance.repository.UserCourseEnrollmentRepository;
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
    private final CourseMaterialRepository materialRepository;
    private final CourseVideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final NoteRepository noteRepository;
    private final StorageService storageService;

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

        return toEnrichedResponse(courseRepository.save(course), null);
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

        return toEnrichedResponse(course, null);
    }

    public void delete(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Course", id));

        // Cascade-delete child rows. Comment likes need to go before comments.
        commentRepository.findByCourseIdOrderByCreatedAtDesc(id, Pageable.unpaged())
                .forEach(c -> commentLikeRepository.deleteByCommentId(c.getId()));
        commentRepository.deleteByCourseId(id);
        courseLikeRepository.deleteByCourseId(id);

        // Remove materials from disk before deleting rows.
        materialRepository.findByCourseIdOrderByUploadedAtDesc(id)
                .forEach(m -> storageService.delete(m.getStoredPath()));
        materialRepository.deleteByCourseId(id);

        // Same for videos.
        videoRepository.findByCourseIdOrderByUploadedAtDesc(id)
                .forEach(v -> storageService.delete(v.getStoredPath()));
        videoRepository.deleteByCourseId(id);

        if (course.getCoverImagePath() != null) {
            storageService.delete(course.getCoverImagePath());
        }

        // Personal enrollments and per-course notes
        enrollmentRepository.deleteByCourseId(id);
        noteRepository.deleteByCourseId(id);

        courseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CourseResponse get(Long id, String clientId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Course", id));
        return toEnrichedResponse(course, clientId);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> list(Pageable pageable, String clientId) {
        return courseRepository.findAll(pageable)
                .map(c -> toEnrichedResponse(c, clientId));
    }

    private CourseResponse toEnrichedResponse(Course course, String clientId) {
        long likes = courseLikeRepository.countByCourseId(course.getId());
        long comments = commentRepository.countByCourseId(course.getId());
        long materials = materialRepository.countByCourseId(course.getId());
        long videos = videoRepository.countByCourseId(course.getId());
        boolean likedByMe = clientId != null && !clientId.isBlank()
                && courseLikeRepository.existsByCourseIdAndClientId(course.getId(), clientId);
        return CourseMapper.toResponse(
                course,
                new CourseMapper.CourseStats(likes, comments, materials, videos, likedByMe)
        );
    }
}

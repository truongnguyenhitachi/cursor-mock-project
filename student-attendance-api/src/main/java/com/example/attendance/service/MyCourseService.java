package com.example.attendance.service;

import com.example.attendance.domain.Course;
import com.example.attendance.domain.User;
import com.example.attendance.domain.UserCourseEnrollment;
import com.example.attendance.dto.CourseResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.mapper.CourseMapper;
import com.example.attendance.repository.CommentRepository;
import com.example.attendance.repository.CourseLikeRepository;
import com.example.attendance.repository.CourseMaterialRepository;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.CourseVideoRepository;
import com.example.attendance.repository.UserCourseEnrollmentRepository;
import com.example.attendance.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class MyCourseService {

    private final CurrentUserService currentUserService;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final CommentRepository commentRepository;
    private final CourseMaterialRepository materialRepository;
    private final CourseVideoRepository videoRepository;

    @Transactional(readOnly = true)
    public List<CourseResponse> myCourses() {
        User user = currentUserService.requireUser();
        return enrollmentRepository.findByUserId(user.getId()).stream()
                .map(UserCourseEnrollment::getCourseId)
                .map(courseRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(c -> toEnrichedResponse(c, user))
                .toList();
    }

    public CourseResponse enroll(Long courseId) {
        User user = currentUserService.requireUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));
        if (enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            throw new ConflictException("Already enrolled in course " + courseId);
        }
        enrollmentRepository.save(UserCourseEnrollment.builder()
                .userId(user.getId())
                .courseId(courseId)
                .build());
        return toEnrichedResponse(course, user);
    }

    public void unenroll(Long courseId) {
        User user = currentUserService.requireUser();
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
        enrollmentRepository.deleteByUserIdAndCourseId(user.getId(), courseId);
    }

    @Transactional(readOnly = true)
    public boolean isEnrolled(Long courseId) {
        return currentUserService.currentUser()
                .map(u -> enrollmentRepository.existsByUserIdAndCourseId(
                        u.getId(), courseId))
                .orElse(false);
    }

    private CourseResponse toEnrichedResponse(Course course, User user) {
        long likes = courseLikeRepository.countByCourseId(course.getId());
        long comments = commentRepository.countByCourseId(course.getId());
        long materials = materialRepository.countByCourseId(course.getId());
        long videos = videoRepository.countByCourseId(course.getId());
        // Likes are still tied to clientId (anonymous), not the user, so we
        // don't claim "likedByMe" here. The /courses/{id} endpoint covers that.
        return CourseMapper.toResponse(course,
                new CourseMapper.CourseStats(likes, comments, materials, videos, false));
    }
}

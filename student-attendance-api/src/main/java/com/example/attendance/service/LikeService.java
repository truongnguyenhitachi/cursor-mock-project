package com.example.attendance.service;

import com.example.attendance.domain.CommentLike;
import com.example.attendance.domain.CourseLike;
import com.example.attendance.dto.LikeStatusResponse;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.repository.CommentLikeRepository;
import com.example.attendance.repository.CommentRepository;
import com.example.attendance.repository.CourseLikeRepository;
import com.example.attendance.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final CourseRepository courseRepository;
    private final CommentRepository commentRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final CommentLikeRepository commentLikeRepository;

    /* ---------- Course likes ---------- */

    @Transactional(readOnly = true)
    public LikeStatusResponse courseStatus(Long courseId, String clientId) {
        ensureCourse(courseId);
        long count = courseLikeRepository.countByCourseId(courseId);
        boolean liked = clientId != null && !clientId.isBlank()
                && courseLikeRepository.existsByCourseIdAndClientId(courseId, clientId);
        return new LikeStatusResponse(count, liked);
    }

    public LikeStatusResponse likeCourse(Long courseId, String clientId) {
        ensureCourse(courseId);
        requireClientId(clientId);
        if (!courseLikeRepository.existsByCourseIdAndClientId(courseId, clientId)) {
            courseLikeRepository.save(CourseLike.builder()
                    .courseId(courseId)
                    .clientId(clientId)
                    .build());
        }
        long count = courseLikeRepository.countByCourseId(courseId);
        return new LikeStatusResponse(count, true);
    }

    public LikeStatusResponse unlikeCourse(Long courseId, String clientId) {
        ensureCourse(courseId);
        requireClientId(clientId);
        courseLikeRepository.deleteByCourseIdAndClientId(courseId, clientId);
        long count = courseLikeRepository.countByCourseId(courseId);
        return new LikeStatusResponse(count, false);
    }

    /* ---------- Comment likes ---------- */

    @Transactional(readOnly = true)
    public LikeStatusResponse commentStatus(Long commentId, String clientId) {
        ensureComment(commentId);
        long count = commentLikeRepository.countByCommentId(commentId);
        boolean liked = clientId != null && !clientId.isBlank()
                && commentLikeRepository.existsByCommentIdAndClientId(commentId, clientId);
        return new LikeStatusResponse(count, liked);
    }

    public LikeStatusResponse likeComment(Long commentId, String clientId) {
        ensureComment(commentId);
        requireClientId(clientId);
        if (!commentLikeRepository.existsByCommentIdAndClientId(commentId, clientId)) {
            commentLikeRepository.save(CommentLike.builder()
                    .commentId(commentId)
                    .clientId(clientId)
                    .build());
        }
        long count = commentLikeRepository.countByCommentId(commentId);
        return new LikeStatusResponse(count, true);
    }

    public LikeStatusResponse unlikeComment(Long commentId, String clientId) {
        ensureComment(commentId);
        requireClientId(clientId);
        commentLikeRepository.deleteByCommentIdAndClientId(commentId, clientId);
        long count = commentLikeRepository.countByCommentId(commentId);
        return new LikeStatusResponse(count, false);
    }

    private void ensureCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
    }

    private void ensureComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw NotFoundException.of("Comment", commentId);
        }
    }

    private static void requireClientId(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalArgumentException(
                    "Missing X-Client-Id header; the client must send a stable identifier to like/unlike."
            );
        }
    }
}

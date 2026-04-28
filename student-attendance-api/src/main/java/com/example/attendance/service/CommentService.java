package com.example.attendance.service;

import com.example.attendance.domain.Comment;
import com.example.attendance.dto.CommentRequest;
import com.example.attendance.dto.CommentResponse;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.repository.CommentLikeRepository;
import com.example.attendance.repository.CommentRepository;
import com.example.attendance.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CourseRepository courseRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;

    @Transactional(readOnly = true)
    public Page<CommentResponse> list(Long courseId, Pageable pageable, String clientId) {
        ensureCourse(courseId);
        Page<Comment> page = commentRepository.findByCourseIdOrderByCreatedAtDesc(courseId, pageable);

        Set<Long> likedIds = likedCommentIds(page.getContent(), clientId);
        return page.map(c -> toResponse(c, likedIds, clientId));
    }

    public CommentResponse create(Long courseId, CommentRequest request, String clientId) {
        ensureCourse(courseId);
        Comment comment = Comment.builder()
                .courseId(courseId)
                .clientId(clientId)
                .authorName(request.authorName().trim())
                .content(request.content().trim())
                .build();
        Comment saved = commentRepository.save(comment);
        return toResponse(saved, Set.of(), clientId);
    }

    public CommentResponse update(Long commentId, CommentRequest request, String clientId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> NotFoundException.of("Comment", commentId));
        if (clientId == null || comment.getClientId() == null
                || !comment.getClientId().equals(clientId)) {
            throw new SecurityException("Only the comment author can edit it");
        }
        comment.setAuthorName(request.authorName().trim());
        comment.setContent(request.content().trim());
        Set<Long> liked = likedCommentIds(List.of(comment), clientId);
        return toResponse(comment, liked, clientId);
    }

    public void delete(Long commentId, String clientId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> NotFoundException.of("Comment", commentId));
        if (clientId == null || comment.getClientId() == null
                || !comment.getClientId().equals(clientId)) {
            throw new SecurityException("Only the comment author can delete it");
        }
        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);
    }

    private Set<Long> likedCommentIds(List<Comment> comments, String clientId) {
        if (clientId == null || clientId.isBlank() || comments.isEmpty()) {
            return Set.of();
        }
        List<Long> ids = comments.stream().map(Comment::getId).toList();
        return commentLikeRepository.findByCommentIdInAndClientId(ids, clientId).stream()
                .map(cl -> cl.getCommentId())
                .collect(Collectors.toSet());
    }

    private CommentResponse toResponse(Comment c, Set<Long> likedIds, String clientId) {
        long likes = commentLikeRepository.countByCommentId(c.getId());
        boolean likedByMe = likedIds.contains(c.getId());
        boolean ownedByMe = clientId != null && c.getClientId() != null
                && c.getClientId().equals(clientId);
        return new CommentResponse(
                c.getId(),
                c.getCourseId(),
                c.getAuthorName(),
                c.getContent(),
                likes,
                likedByMe,
                ownedByMe,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    private void ensureCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
    }
}

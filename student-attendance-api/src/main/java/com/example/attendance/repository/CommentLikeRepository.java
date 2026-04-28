package com.example.attendance.repository;

import com.example.attendance.domain.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    Optional<CommentLike> findByCommentIdAndClientId(Long commentId, String clientId);

    boolean existsByCommentIdAndClientId(Long commentId, String clientId);

    long countByCommentId(Long commentId);

    void deleteByCommentIdAndClientId(Long commentId, String clientId);

    void deleteByCommentId(Long commentId);

    List<CommentLike> findByCommentIdInAndClientId(Collection<Long> commentIds, String clientId);
}

package com.example.attendance.repository;

import com.example.attendance.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByCourseIdOrderByCreatedAtDesc(Long courseId, Pageable pageable);

    long countByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);
}

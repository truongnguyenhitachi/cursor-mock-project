package com.example.attendance.repository;

import com.example.attendance.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<Note> findByUserIdAndCourseIdOrderByUpdatedAtDesc(Long userId, Long courseId);

    Optional<Note> findByIdAndUserId(Long id, Long userId);

    void deleteByCourseId(Long courseId);

    void deleteByUserId(Long userId);
}

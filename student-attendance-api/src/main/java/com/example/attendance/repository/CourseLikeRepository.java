package com.example.attendance.repository;

import com.example.attendance.domain.CourseLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseLikeRepository extends JpaRepository<CourseLike, Long> {

    Optional<CourseLike> findByCourseIdAndClientId(Long courseId, String clientId);

    boolean existsByCourseIdAndClientId(Long courseId, String clientId);

    long countByCourseId(Long courseId);

    void deleteByCourseIdAndClientId(Long courseId, String clientId);

    void deleteByCourseId(Long courseId);
}

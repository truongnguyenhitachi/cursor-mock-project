package com.example.attendance.repository;

import com.example.attendance.domain.UserCourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCourseEnrollmentRepository
        extends JpaRepository<UserCourseEnrollment, Long> {

    List<UserCourseEnrollment> findByUserId(Long userId);

    Optional<UserCourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    void deleteByUserIdAndCourseId(Long userId, Long courseId);

    void deleteByCourseId(Long courseId);

    void deleteByUserId(Long userId);
}

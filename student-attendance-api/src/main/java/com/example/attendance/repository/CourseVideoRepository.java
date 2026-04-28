package com.example.attendance.repository;

import com.example.attendance.domain.CourseVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseVideoRepository extends JpaRepository<CourseVideo, Long> {

    List<CourseVideo> findByCourseIdOrderByUploadedAtDesc(Long courseId);

    long countByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);
}

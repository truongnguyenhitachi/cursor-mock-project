package com.example.attendance.repository;

import com.example.attendance.domain.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {

    List<CourseMaterial> findByCourseIdOrderByUploadedAtDesc(Long courseId);

    long countByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);
}

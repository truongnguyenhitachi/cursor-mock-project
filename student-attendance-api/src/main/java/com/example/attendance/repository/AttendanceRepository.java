package com.example.attendance.repository;

import com.example.attendance.domain.Attendance;
import com.example.attendance.domain.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudent_IdAndCourse_IdAndSessionDate(
            Long studentId, Long courseId, LocalDate sessionDate);

    boolean existsByStudent_IdAndCourse_IdAndSessionDate(
            Long studentId, Long courseId, LocalDate sessionDate);

    Page<Attendance> findByStudent_Id(Long studentId, Pageable pageable);

    Page<Attendance> findByCourse_Id(Long courseId, Pageable pageable);

    List<Attendance> findByCourse_IdAndSessionDate(Long courseId, LocalDate sessionDate);

    @Query("""
            select a.status as status, count(a) as total
            from Attendance a
            where a.student.id = :studentId
              and (:courseId is null or a.course.id = :courseId)
            group by a.status
            """)
    List<StatusCount> summarizeByStudent(@Param("studentId") Long studentId,
                                         @Param("courseId") Long courseId);

    interface StatusCount {
        AttendanceStatus getStatus();
        Long getTotal();
    }
}

package com.example.attendance.service;

import com.example.attendance.domain.Attendance;
import com.example.attendance.domain.AttendanceStatus;
import com.example.attendance.domain.Course;
import com.example.attendance.domain.Student;
import com.example.attendance.dto.AttendanceRequest;
import com.example.attendance.dto.AttendanceResponse;
import com.example.attendance.dto.AttendanceSummaryResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.mapper.AttendanceMapper;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public AttendanceResponse record(AttendanceRequest request) {
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> NotFoundException.of("Student", request.studentId()));
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> NotFoundException.of("Course", request.courseId()));

        if (attendanceRepository.existsByStudent_IdAndCourse_IdAndSessionDate(
                student.getId(), course.getId(), request.sessionDate())) {
            throw new ConflictException("Attendance already recorded for that student/course/date");
        }

        Attendance attendance = Attendance.builder()
                .student(student)
                .course(course)
                .sessionDate(request.sessionDate())
                .status(request.status())
                .remarks(request.remarks())
                .build();

        return AttendanceMapper.toResponse(attendanceRepository.save(attendance));
    }

    public AttendanceResponse update(Long id, AttendanceRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Attendance", id));

        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> NotFoundException.of("Student", request.studentId()));
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> NotFoundException.of("Course", request.courseId()));

        boolean keyChanged = !attendance.getStudent().getId().equals(request.studentId())
                || !attendance.getCourse().getId().equals(request.courseId())
                || !attendance.getSessionDate().equals(request.sessionDate());

        if (keyChanged && attendanceRepository.existsByStudent_IdAndCourse_IdAndSessionDate(
                request.studentId(), request.courseId(), request.sessionDate())) {
            throw new ConflictException("Attendance already recorded for that student/course/date");
        }

        attendance.setStudent(student);
        attendance.setCourse(course);
        attendance.setSessionDate(request.sessionDate());
        attendance.setStatus(request.status());
        attendance.setRemarks(request.remarks());

        return AttendanceMapper.toResponse(attendance);
    }

    public void delete(Long id) {
        if (!attendanceRepository.existsById(id)) {
            throw NotFoundException.of("Attendance", id);
        }
        attendanceRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public AttendanceResponse get(Long id) {
        return attendanceRepository.findById(id)
                .map(AttendanceMapper::toResponse)
                .orElseThrow(() -> NotFoundException.of("Attendance", id));
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> listByStudent(Long studentId, Pageable pageable) {
        if (!studentRepository.existsById(studentId)) {
            throw NotFoundException.of("Student", studentId);
        }
        return attendanceRepository.findByStudent_Id(studentId, pageable).map(AttendanceMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> listByCourse(Long courseId, Pageable pageable) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
        return attendanceRepository.findByCourse_Id(courseId, pageable).map(AttendanceMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> listByCourseAndDate(Long courseId, LocalDate date) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
        return attendanceRepository.findByCourse_IdAndSessionDate(courseId, date)
                .stream()
                .map(AttendanceMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceSummaryResponse summarize(Long studentId, Long courseId) {
        if (!studentRepository.existsById(studentId)) {
            throw NotFoundException.of("Student", studentId);
        }
        if (courseId != null && !courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }

        Map<AttendanceStatus, Long> counts = new EnumMap<>(AttendanceStatus.class);
        for (AttendanceStatus status : AttendanceStatus.values()) {
            counts.put(status, 0L);
        }
        long total = 0L;
        for (var row : attendanceRepository.summarizeByStudent(studentId, courseId)) {
            counts.put(row.getStatus(), row.getTotal());
            total += row.getTotal();
        }
        return new AttendanceSummaryResponse(studentId, courseId, total, counts);
    }
}

package com.example.attendance.web;

import com.example.attendance.dto.AttendanceRequest;
import com.example.attendance.dto.AttendanceResponse;
import com.example.attendance.dto.AttendanceSummaryResponse;
import com.example.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<AttendanceResponse> record(@Valid @RequestBody AttendanceRequest request) {
        AttendanceResponse created = attendanceService.record(request);
        return ResponseEntity.created(URI.create("/attendance/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public AttendanceResponse get(@PathVariable Long id) {
        return attendanceService.get(id);
    }

    @PutMapping("/{id}")
    public AttendanceResponse update(@PathVariable Long id, @Valid @RequestBody AttendanceRequest request) {
        return attendanceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        attendanceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/students/{studentId}")
    public Page<AttendanceResponse> listByStudent(@PathVariable Long studentId, Pageable pageable) {
        return attendanceService.listByStudent(studentId, pageable);
    }

    @GetMapping("/courses/{courseId}")
    public Page<AttendanceResponse> listByCourse(@PathVariable Long courseId, Pageable pageable) {
        return attendanceService.listByCourse(courseId, pageable);
    }

    @GetMapping("/courses/{courseId}/sessions")
    public List<AttendanceResponse> listByCourseAndDate(
            @PathVariable Long courseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.listByCourseAndDate(courseId, date);
    }

    @GetMapping("/students/{studentId}/summary")
    public AttendanceSummaryResponse summarize(
            @PathVariable Long studentId,
            @RequestParam(required = false) Long courseId) {
        return attendanceService.summarize(studentId, courseId);
    }
}

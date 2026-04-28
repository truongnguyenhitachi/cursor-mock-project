package com.example.attendance.web;

import com.example.attendance.dto.StudentRequest;
import com.example.attendance.dto.StudentResponse;
import com.example.attendance.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request) {
        StudentResponse created = studentService.create(request);
        return ResponseEntity.created(URI.create("/students/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public StudentResponse get(@PathVariable Long id) {
        return studentService.get(id);
    }

    @GetMapping
    public Page<StudentResponse> search(@RequestParam(required = false) String query, Pageable pageable) {
        return studentService.search(query, pageable);
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return studentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{studentId}/courses/{courseId}")
    public StudentResponse enroll(@PathVariable Long studentId, @PathVariable Long courseId) {
        return studentService.enroll(studentId, courseId);
    }

    @DeleteMapping("/{studentId}/courses/{courseId}")
    public StudentResponse unenroll(@PathVariable Long studentId, @PathVariable Long courseId) {
        return studentService.unenroll(studentId, courseId);
    }
}

package com.example.attendance.web;

import com.example.attendance.dto.CourseRequest;
import com.example.attendance.dto.CourseResponse;
import com.example.attendance.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    public static final String CLIENT_ID_HEADER = "X-Client-Id";

    private final CourseService courseService;

    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request) {
        CourseResponse created = courseService.create(request);
        return ResponseEntity.created(URI.create("/courses/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public CourseResponse get(
            @PathVariable Long id,
            @RequestHeader(value = CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return courseService.get(id, clientId);
    }

    @GetMapping
    public Page<CourseResponse> list(
            Pageable pageable,
            @RequestHeader(value = CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return courseService.list(pageable, clientId);
    }

    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return courseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

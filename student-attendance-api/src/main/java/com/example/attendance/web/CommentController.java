package com.example.attendance.web;

import com.example.attendance.dto.CommentRequest;
import com.example.attendance.dto.CommentResponse;
import com.example.attendance.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/courses/{courseId}/comments")
    public Page<CommentResponse> list(
            @PathVariable Long courseId,
            Pageable pageable,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return commentService.list(courseId, pageable, clientId);
    }

    @PostMapping("/courses/{courseId}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable Long courseId,
            @Valid @RequestBody CommentRequest request,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        CommentResponse created = commentService.create(courseId, request, clientId);
        return ResponseEntity
                .created(URI.create("/courses/" + courseId + "/comments/" + created.id()))
                .body(created);
    }

    @PutMapping("/comments/{commentId}")
    public CommentResponse update(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return commentService.update(commentId, request, clientId);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long commentId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        commentService.delete(commentId, clientId);
        return ResponseEntity.noContent().build();
    }
}

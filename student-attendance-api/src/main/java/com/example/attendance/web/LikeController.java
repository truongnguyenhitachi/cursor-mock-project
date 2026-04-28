package com.example.attendance.web;

import com.example.attendance.dto.LikeStatusResponse;
import com.example.attendance.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    /* ---------- Courses ---------- */

    @GetMapping("/courses/{courseId}/likes")
    public LikeStatusResponse courseStatus(
            @PathVariable Long courseId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.courseStatus(courseId, clientId);
    }

    @PostMapping("/courses/{courseId}/likes")
    public LikeStatusResponse likeCourse(
            @PathVariable Long courseId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.likeCourse(courseId, clientId);
    }

    @DeleteMapping("/courses/{courseId}/likes")
    public LikeStatusResponse unlikeCourse(
            @PathVariable Long courseId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.unlikeCourse(courseId, clientId);
    }

    /* ---------- Comments ---------- */

    @GetMapping("/comments/{commentId}/likes")
    public LikeStatusResponse commentStatus(
            @PathVariable Long commentId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.commentStatus(commentId, clientId);
    }

    @PostMapping("/comments/{commentId}/likes")
    public LikeStatusResponse likeComment(
            @PathVariable Long commentId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.likeComment(commentId, clientId);
    }

    @DeleteMapping("/comments/{commentId}/likes")
    public LikeStatusResponse unlikeComment(
            @PathVariable Long commentId,
            @RequestHeader(value = CourseController.CLIENT_ID_HEADER, required = false) String clientId
    ) {
        return likeService.unlikeComment(commentId, clientId);
    }
}

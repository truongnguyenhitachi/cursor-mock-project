package com.example.attendance.service;

import com.example.attendance.domain.Note;
import com.example.attendance.domain.User;
import com.example.attendance.dto.NoteRequest;
import com.example.attendance.dto.NoteResponse;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.NoteRepository;
import com.example.attendance.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<NoteResponse> listAll() {
        User user = currentUserService.requireUser();
        return noteRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(NoteService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> listForCourse(Long courseId) {
        User user = currentUserService.requireUser();
        return noteRepository
                .findByUserIdAndCourseIdOrderByUpdatedAtDesc(user.getId(), courseId)
                .stream()
                .map(NoteService::toResponse)
                .toList();
    }

    public NoteResponse create(NoteRequest request) {
        User user = currentUserService.requireUser();
        if (request.courseId() != null
                && !courseRepository.existsById(request.courseId())) {
            throw NotFoundException.of("Course", request.courseId());
        }
        Note note = Note.builder()
                .userId(user.getId())
                .courseId(request.courseId())
                .title(request.title().trim())
                .content(request.content().trim())
                .build();
        return toResponse(noteRepository.save(note));
    }

    public NoteResponse update(Long id, NoteRequest request) {
        User user = currentUserService.requireUser();
        Note note = noteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> NotFoundException.of("Note", id));
        if (request.courseId() != null
                && !courseRepository.existsById(request.courseId())) {
            throw NotFoundException.of("Course", request.courseId());
        }
        note.setTitle(request.title().trim());
        note.setContent(request.content().trim());
        note.setCourseId(request.courseId());
        return toResponse(note);
    }

    public void delete(Long id) {
        User user = currentUserService.requireUser();
        Note note = noteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> NotFoundException.of("Note", id));
        noteRepository.delete(note);
    }

    private static NoteResponse toResponse(Note n) {
        return new NoteResponse(
                n.getId(),
                n.getUserId(),
                n.getCourseId(),
                n.getTitle(),
                n.getContent(),
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }
}

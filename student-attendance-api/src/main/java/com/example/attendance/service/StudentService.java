package com.example.attendance.service;

import com.example.attendance.domain.Course;
import com.example.attendance.domain.Student;
import com.example.attendance.dto.StudentRequest;
import com.example.attendance.dto.StudentResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.mapper.StudentMapper;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public StudentResponse create(StudentRequest request) {
        if (studentRepository.existsByStudentCode(request.studentCode())) {
            throw new ConflictException("Student code already exists: " + request.studentCode());
        }
        if (studentRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email());
        }

        Student student = Student.builder()
                .studentCode(request.studentCode())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .dateOfBirth(request.dateOfBirth())
                .courses(loadCourses(request.courseIds()))
                .build();

        return StudentMapper.toResponse(studentRepository.save(student));
    }

    public StudentResponse update(Long id, StudentRequest request) {
        Student student = studentRepository.findWithCoursesById(id)
                .orElseThrow(() -> NotFoundException.of("Student", id));

        if (!student.getStudentCode().equals(request.studentCode())
                && studentRepository.existsByStudentCode(request.studentCode())) {
            throw new ConflictException("Student code already exists: " + request.studentCode());
        }
        if (!student.getEmail().equalsIgnoreCase(request.email())
                && studentRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email());
        }

        student.setStudentCode(request.studentCode());
        student.setFirstName(request.firstName());
        student.setLastName(request.lastName());
        student.setEmail(request.email());
        student.setDateOfBirth(request.dateOfBirth());
        student.setCourses(loadCourses(request.courseIds()));

        return StudentMapper.toResponse(student);
    }

    public void delete(Long id) {
        if (!studentRepository.existsById(id)) {
            throw NotFoundException.of("Student", id);
        }
        studentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public StudentResponse get(Long id) {
        Student student = studentRepository.findWithCoursesById(id)
                .orElseThrow(() -> NotFoundException.of("Student", id));
        return StudentMapper.toResponse(student);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> search(String query, Pageable pageable) {
        Page<Student> page = (query == null || query.isBlank())
                ? studentRepository.findAll(pageable)
                : studentRepository.findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(
                        query, query, pageable);
        return page.map(StudentMapper::toResponse);
    }

    public StudentResponse enroll(Long studentId, Long courseId) {
        Student student = studentRepository.findWithCoursesById(studentId)
                .orElseThrow(() -> NotFoundException.of("Student", studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));

        if (student.getCourses().add(course)) {
            studentRepository.save(student);
        }
        return StudentMapper.toResponse(student);
    }

    public StudentResponse unenroll(Long studentId, Long courseId) {
        Student student = studentRepository.findWithCoursesById(studentId)
                .orElseThrow(() -> NotFoundException.of("Student", studentId));
        student.getCourses().removeIf(c -> c.getId().equals(courseId));
        return StudentMapper.toResponse(student);
    }

    private Set<Course> loadCourses(Set<Long> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return new HashSet<>();
        }
        Set<Course> courses = new HashSet<>(courseRepository.findAllById(courseIds));
        if (courses.size() != courseIds.size()) {
            Set<Long> found = new HashSet<>();
            courses.forEach(c -> found.add(c.getId()));
            Set<Long> missing = new HashSet<>(courseIds);
            missing.removeAll(found);
            throw new NotFoundException("Some courses were not found: " + missing);
        }
        return courses;
    }
}

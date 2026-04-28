package com.example.attendance.config;

import com.example.attendance.domain.Attendance;
import com.example.attendance.domain.AttendanceStatus;
import com.example.attendance.domain.Course;
import com.example.attendance.domain.Student;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Profile("h2")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (studentRepository.count() > 0 || courseRepository.count() > 0) {
            return;
        }

        Course math = courseRepository.save(Course.builder()
                .courseCode("MATH101").name("Calculus I")
                .description("Limits, derivatives, integrals").credits(4).build());
        Course cs = courseRepository.save(Course.builder()
                .courseCode("CS101").name("Intro to Computer Science")
                .description("Foundations of CS").credits(3).build());
        Course eng = courseRepository.save(Course.builder()
                .courseCode("ENG101").name("English Composition")
                .description("Academic writing").credits(3).build());

        Set<Course> aliceCourses = new HashSet<>(List.of(math, cs));
        Set<Course> bobCourses = new HashSet<>(List.of(cs, eng));

        Student alice = studentRepository.save(Student.builder()
                .studentCode("S0001").firstName("Alice").lastName("Nguyen")
                .email("alice@example.com").dateOfBirth(LocalDate.of(2003, 5, 14))
                .courses(aliceCourses).build());
        Student bob = studentRepository.save(Student.builder()
                .studentCode("S0002").firstName("Bob").lastName("Tran")
                .email("bob@example.com").dateOfBirth(LocalDate.of(2002, 9, 30))
                .courses(bobCourses).build());

        LocalDate today = LocalDate.now();
        attendanceRepository.saveAll(List.of(
                Attendance.builder().student(alice).course(cs).sessionDate(today.minusDays(2))
                        .status(AttendanceStatus.PRESENT).build(),
                Attendance.builder().student(alice).course(cs).sessionDate(today.minusDays(1))
                        .status(AttendanceStatus.LATE).remarks("Bus delay").build(),
                Attendance.builder().student(alice).course(math).sessionDate(today.minusDays(2))
                        .status(AttendanceStatus.PRESENT).build(),
                Attendance.builder().student(bob).course(cs).sessionDate(today.minusDays(2))
                        .status(AttendanceStatus.ABSENT).remarks("Sick").build(),
                Attendance.builder().student(bob).course(eng).sessionDate(today.minusDays(1))
                        .status(AttendanceStatus.EXCUSED).build()
        ));
    }
}

package com.example.attendance.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_course_enrollments",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_course_enrollment",
                        columnNames = {"user_id", "course_id"}
                )
        },
        indexes = {
                @Index(name = "ix_user_course_user", columnList = "user_id"),
                @Index(name = "ix_user_course_course", columnList = "course_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @PrePersist
    void onCreate() {
        this.enrolledAt = LocalDateTime.now();
    }
}

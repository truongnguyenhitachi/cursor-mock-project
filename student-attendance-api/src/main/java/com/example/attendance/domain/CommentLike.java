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
        name = "comment_likes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_comment_likes_comment_client",
                        columnNames = {"comment_id", "client_id"}
                )
        },
        indexes = {
                @Index(name = "ix_comment_likes_comment", columnList = "comment_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @Column(name = "client_id", nullable = false, length = 64)
    private String clientId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

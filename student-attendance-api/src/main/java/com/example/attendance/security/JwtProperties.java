package com.example.attendance.security;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Secret used to sign HS256 JWTs. Must be at least 32 chars (256 bits).
     * For dev a default is provided in application.yml; override in production.
     */
    @NotBlank
    private String secret = "change-me-in-production-change-me-in-production";

    /** Token lifetime. Defaults to 12 hours. */
    private Duration expiration = Duration.ofHours(12);

    /** Issuer claim placed on every issued token. */
    private String issuer = "student-attendance-api";
}

package com.example.attendance.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class StorageProperties {

    /** Root directory for uploaded files (resolved relative to working dir). */
    @NotBlank
    private String uploadDir = "./uploads";
}

package com.example.attendance.service;

import com.example.attendance.config.StorageProperties;
import com.example.attendance.exception.NotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final StorageProperties properties;

    private Path root() {
        return Paths.get(properties.getUploadDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(root());
    }

    /**
     * Persist the given multipart file under {@code subDir}, returning the
     * stored relative path. The file is renamed to a UUID + the original
     * extension so collisions are impossible and the original name is
     * preserved separately for download.
     */
    public StoredFile save(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        String originalName = file.getOriginalFilename() != null
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : "file";
        String extension = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > -1 && dot < originalName.length() - 1) {
            extension = originalName.substring(dot);
        }
        String storedName = UUID.randomUUID() + extension;
        String relativePath = subDir + "/" + storedName;

        Path target = root().resolve(relativePath).normalize();
        if (!target.startsWith(root())) {
            throw new SecurityException("Resolved path escapes upload root");
        }
        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file " + relativePath, e);
        }

        return new StoredFile(
                relativePath,
                originalName,
                file.getContentType(),
                file.getSize()
        );
    }

    public Resource loadAsResource(String relativePath) {
        Path file = root().resolve(relativePath).normalize();
        if (!file.startsWith(root())) {
            throw new SecurityException("Resolved path escapes upload root");
        }
        try {
            UrlResource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NotFoundException("File not found: " + relativePath);
            }
            return resource;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load file " + relativePath, e);
        }
    }

    public void delete(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        Path file = root().resolve(relativePath).normalize();
        if (!file.startsWith(root())) {
            throw new SecurityException("Resolved path escapes upload root");
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            // Swallow; failing to delete a stale file shouldn't break the API call.
        }
    }

    public record StoredFile(
            String relativePath,
            String originalFilename,
            String contentType,
            long sizeBytes
    ) {}
}

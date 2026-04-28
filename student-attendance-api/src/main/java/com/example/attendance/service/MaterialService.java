package com.example.attendance.service;

import com.example.attendance.domain.Course;
import com.example.attendance.domain.CourseMaterial;
import com.example.attendance.dto.CourseMaterialResponse;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.repository.CourseMaterialRepository;
import com.example.attendance.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MaterialService {

    private static final String MATERIALS_SUBDIR_PREFIX = "courses";

    private final CourseRepository courseRepository;
    private final CourseMaterialRepository materialRepository;
    private final StorageService storageService;

    public List<CourseMaterialResponse> list(Long courseId) {
        ensureCourse(courseId);
        return materialRepository.findByCourseIdOrderByUploadedAtDesc(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CourseMaterialResponse> upload(Long courseId, List<MultipartFile> files) {
        ensureCourse(courseId);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No files provided");
        }
        String subDir = MATERIALS_SUBDIR_PREFIX + "/" + courseId + "/materials";
        return files.stream()
                .filter(f -> f != null && !f.isEmpty())
                .map(f -> {
                    StorageService.StoredFile stored = storageService.save(f, subDir);
                    CourseMaterial material = CourseMaterial.builder()
                            .courseId(courseId)
                            .originalFilename(stored.originalFilename())
                            .storedPath(stored.relativePath())
                            .contentType(stored.contentType())
                            .sizeBytes(stored.sizeBytes())
                            .build();
                    return toResponse(materialRepository.save(material));
                })
                .toList();
    }

    public DownloadPayload download(Long courseId, Long materialId) {
        CourseMaterial material = findInCourse(courseId, materialId);
        Resource resource = storageService.loadAsResource(material.getStoredPath());
        return new DownloadPayload(material, resource);
    }

    public void delete(Long courseId, Long materialId) {
        CourseMaterial material = findInCourse(courseId, materialId);
        storageService.delete(material.getStoredPath());
        materialRepository.delete(material);
    }

    public CourseMaterialResponse setCover(Long courseId, MultipartFile file) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cover image must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Cover must be an image (got " + contentType + ")");
        }

        if (course.getCoverImagePath() != null) {
            storageService.delete(course.getCoverImagePath());
        }

        String subDir = MATERIALS_SUBDIR_PREFIX + "/" + courseId + "/cover";
        StorageService.StoredFile stored = storageService.save(file, subDir);
        course.setCoverImagePath(stored.relativePath());

        return new CourseMaterialResponse(
                null,
                courseId,
                stored.originalFilename(),
                stored.contentType(),
                stored.sizeBytes(),
                "/courses/" + courseId + "/cover",
                course.getUpdatedAt()
        );
    }

    public void clearCover(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));
        if (course.getCoverImagePath() != null) {
            storageService.delete(course.getCoverImagePath());
            course.setCoverImagePath(null);
        }
    }

    public CoverPayload loadCover(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));
        if (course.getCoverImagePath() == null) {
            throw new NotFoundException("Cover image not set for course " + courseId);
        }
        Resource resource = storageService.loadAsResource(course.getCoverImagePath());
        return new CoverPayload(resource, guessContentType(course.getCoverImagePath()));
    }

    private void ensureCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
    }

    private CourseMaterial findInCourse(Long courseId, Long materialId) {
        CourseMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> NotFoundException.of("Material", materialId));
        if (!material.getCourseId().equals(courseId)) {
            throw NotFoundException.of("Material", materialId);
        }
        return material;
    }

    private CourseMaterialResponse toResponse(CourseMaterial m) {
        return new CourseMaterialResponse(
                m.getId(),
                m.getCourseId(),
                m.getOriginalFilename(),
                m.getContentType(),
                m.getSizeBytes(),
                "/courses/" + m.getCourseId() + "/materials/" + m.getId() + "/download",
                m.getUploadedAt()
        );
    }

    private static String guessContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    public record DownloadPayload(CourseMaterial material, Resource resource) {}

    public record CoverPayload(Resource resource, String contentType) {}
}

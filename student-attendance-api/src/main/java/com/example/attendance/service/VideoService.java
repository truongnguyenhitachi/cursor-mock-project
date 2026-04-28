package com.example.attendance.service;

import com.example.attendance.domain.CourseVideo;
import com.example.attendance.dto.CourseVideoRequest;
import com.example.attendance.dto.CourseVideoResponse;
import com.example.attendance.exception.NotFoundException;
import com.example.attendance.repository.CourseRepository;
import com.example.attendance.repository.CourseVideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VideoService {

    private final CourseRepository courseRepository;
    private final CourseVideoRepository videoRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<CourseVideoResponse> list(Long courseId) {
        ensureCourse(courseId);
        return videoRepository.findByCourseIdOrderByUploadedAtDesc(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    public CourseVideoResponse upload(
            Long courseId,
            MultipartFile file,
            String title,
            String description
    ) {
        ensureCourse(courseId);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new IllegalArgumentException(
                    "File must be a video (got " + contentType + ")"
            );
        }
        String safeTitle = title == null || title.isBlank()
                ? originalName(file)
                : title.trim();
        if (safeTitle.length() > 200) {
            safeTitle = safeTitle.substring(0, 200);
        }

        String subDir = "courses/" + courseId + "/videos";
        StorageService.StoredFile stored = storageService.save(file, subDir);

        CourseVideo video = CourseVideo.builder()
                .courseId(courseId)
                .title(safeTitle)
                .description(description == null || description.isBlank()
                        ? null
                        : description.trim())
                .originalFilename(stored.originalFilename())
                .storedPath(stored.relativePath())
                .contentType(stored.contentType())
                .sizeBytes(stored.sizeBytes())
                .build();
        return toResponse(videoRepository.save(video));
    }

    public CourseVideoResponse updateMetadata(
            Long courseId,
            Long videoId,
            CourseVideoRequest request
    ) {
        CourseVideo video = findInCourse(courseId, videoId);
        video.setTitle(request.title().trim());
        video.setDescription(
                request.description() == null || request.description().isBlank()
                        ? null
                        : request.description().trim()
        );
        return toResponse(video);
    }

    public void delete(Long courseId, Long videoId) {
        CourseVideo video = findInCourse(courseId, videoId);
        storageService.delete(video.getStoredPath());
        videoRepository.delete(video);
    }

    @Transactional(readOnly = true)
    public StreamPayload streamPayload(Long courseId, Long videoId) {
        CourseVideo video = findInCourse(courseId, videoId);
        Resource resource = storageService.loadAsResource(video.getStoredPath());
        return new StreamPayload(video, resource);
    }

    @Transactional(readOnly = true)
    public DownloadPayload downloadPayload(Long courseId, Long videoId) {
        CourseVideo video = findInCourse(courseId, videoId);
        Resource resource = storageService.loadAsResource(video.getStoredPath());
        return new DownloadPayload(video, resource);
    }

    private static String originalName(MultipartFile file) {
        return file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank()
                ? file.getOriginalFilename()
                : "video";
    }

    private void ensureCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw NotFoundException.of("Course", courseId);
        }
    }

    private CourseVideo findInCourse(Long courseId, Long videoId) {
        CourseVideo video = videoRepository.findById(videoId)
                .orElseThrow(() -> NotFoundException.of("Video", videoId));
        if (!video.getCourseId().equals(courseId)) {
            throw NotFoundException.of("Video", videoId);
        }
        return video;
    }

    private CourseVideoResponse toResponse(CourseVideo v) {
        return new CourseVideoResponse(
                v.getId(),
                v.getCourseId(),
                v.getTitle(),
                v.getDescription(),
                v.getOriginalFilename(),
                v.getContentType(),
                v.getSizeBytes(),
                "/courses/" + v.getCourseId() + "/videos/" + v.getId() + "/stream",
                "/courses/" + v.getCourseId() + "/videos/" + v.getId() + "/download",
                v.getUploadedAt(),
                v.getUpdatedAt()
        );
    }

    public record StreamPayload(CourseVideo video, Resource resource) {}

    public record DownloadPayload(CourseVideo video, Resource resource) {}
}

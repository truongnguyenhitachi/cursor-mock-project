package com.example.attendance.web;

import com.example.attendance.dto.CourseVideoRequest;
import com.example.attendance.dto.CourseVideoResponse;
import com.example.attendance.service.VideoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/videos")
@RequiredArgsConstructor
public class VideoController {

    /** Chunk size returned for byte-range requests. 1 MB is a common default. */
    private static final long RANGE_CHUNK = 1024L * 1024L;

    private final VideoService videoService;

    @GetMapping
    public List<CourseVideoResponse> list(@PathVariable Long courseId) {
        return videoService.list(courseId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CourseVideoResponse> upload(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description
    ) {
        CourseVideoResponse created = videoService.upload(courseId, file, title, description);
        URI location = URI.create("/courses/" + courseId + "/videos/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{videoId}")
    public CourseVideoResponse updateMetadata(
            @PathVariable Long courseId,
            @PathVariable Long videoId,
            @Valid @RequestBody CourseVideoRequest request
    ) {
        return videoService.updateMetadata(courseId, videoId, request);
    }

    @DeleteMapping("/{videoId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long videoId
    ) {
        videoService.delete(courseId, videoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{videoId}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long courseId,
            @PathVariable Long videoId
    ) {
        VideoService.DownloadPayload payload = videoService.downloadPayload(courseId, videoId);
        String filename = URLEncoder.encode(
                payload.video().getOriginalFilename(),
                StandardCharsets.UTF_8
        ).replace("+", "%20");
        String contentType = payload.video().getContentType();
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + filename
                )
                .contentType(contentType != null
                        ? MediaType.parseMediaType(contentType)
                        : MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(payload.video().getSizeBytes())
                .body(payload.resource());
    }

    /**
     * Streams the video with byte-range support so the HTML5 &lt;video&gt; element
     * can seek and progressively download. When the client sends a {@code Range}
     * header we respond with {@code 206 Partial Content} and only the requested
     * slice; otherwise we respond with {@code 200 OK} but still in a 1 MB chunk
     * (most browsers will follow up with range requests for the rest).
     */
    @GetMapping("/{videoId}/stream")
    public ResponseEntity<ResourceRegion> stream(
            @PathVariable Long courseId,
            @PathVariable Long videoId,
            @RequestHeader HttpHeaders headers
    ) throws IOException {
        VideoService.StreamPayload payload = videoService.streamPayload(courseId, videoId);
        Resource resource = payload.resource();
        long contentLength = resource.contentLength();
        MediaType mediaType = payload.video().getContentType() != null
                ? MediaType.parseMediaType(payload.video().getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;

        List<HttpRange> ranges = headers.getRange();
        ResourceRegion region;
        HttpStatus status;
        if (ranges.isEmpty()) {
            long length = Math.min(RANGE_CHUNK, contentLength);
            region = new ResourceRegion(resource, 0, length);
            status = HttpStatus.OK;
        } else {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long length = Math.min(RANGE_CHUNK, end - start + 1);
            region = new ResourceRegion(resource, start, length);
            status = HttpStatus.PARTIAL_CONTENT;
        }

        return ResponseEntity.status(status)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .contentType(mediaType)
                .body(region);
    }
}

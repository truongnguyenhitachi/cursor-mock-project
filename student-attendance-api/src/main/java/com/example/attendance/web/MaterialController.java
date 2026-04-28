package com.example.attendance.web;

import com.example.attendance.dto.CourseMaterialResponse;
import com.example.attendance.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    /* ---------- Materials ---------- */

    @GetMapping("/materials")
    public List<CourseMaterialResponse> list(@PathVariable Long courseId) {
        return materialService.list(courseId);
    }

    @PostMapping(value = "/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<CourseMaterialResponse> upload(
            @PathVariable Long courseId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        return materialService.upload(courseId, files);
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long materialId
    ) {
        materialService.delete(courseId, materialId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/materials/{materialId}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long courseId,
            @PathVariable Long materialId
    ) {
        MaterialService.DownloadPayload payload = materialService.download(courseId, materialId);
        String filename = URLEncoder.encode(
                payload.material().getOriginalFilename(),
                StandardCharsets.UTF_8
        ).replace("+", "%20");
        String contentType = payload.material().getContentType();

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + filename
                )
                .contentType(contentType != null
                        ? MediaType.parseMediaType(contentType)
                        : MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(payload.material().getSizeBytes())
                .body(payload.resource());
    }

    /* ---------- Cover image ---------- */

    @PostMapping(value = "/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CourseMaterialResponse setCover(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file
    ) {
        return materialService.setCover(courseId, file);
    }

    @DeleteMapping("/cover")
    public ResponseEntity<Void> clearCover(@PathVariable Long courseId) {
        materialService.clearCover(courseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cover")
    public ResponseEntity<Resource> getCover(@PathVariable Long courseId) {
        MaterialService.CoverPayload payload = materialService.loadCover(courseId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
                .body(payload.resource());
    }
}

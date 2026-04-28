# Student Attendance API

A Spring Boot 3 REST API for managing students, courses, and their daily attendance records.

- Java 17, Spring Boot 3.3.4
- Spring Web, Spring Data JPA (Hibernate 6), Bean Validation
- MySQL (default profile) and H2 in-memory (`h2` profile, auto-seeded with sample data)
- Lombok

---

## Running

### MySQL (default profile)

```bash
# Optional env vars (defaults shown)
# DB_USERNAME=root
# DB_PASSWORD=root
mvn spring-boot:run
```

The app creates / migrates the `student_attendance` schema on `localhost:3306`.

### H2 (local dev, no DB needed)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

Or with a packaged jar:

```bash
mvn -DskipTests package
java -jar target/student-attendance-api-1.0.0.jar --spring.profiles.active=h2
```

The H2 profile seeds 2 students, 3 courses, and 5 attendance records on startup, and exposes the H2 console at `/api/v1/h2-console`.

---

## Conventions

- Base URL: `http://localhost:8080/api/v1`
- All requests/responses are `application/json`
- Pagination follows Spring Data: `?page=0&size=20&sort=field,asc`
- Dates use ISO format: `YYYY-MM-DD`
- Timestamps use ISO-8601: `YYYY-MM-DDTHH:MM:SS`

### Error response shape

Returned for all 4xx/5xx errors (`violations` is only populated for `400 Validation failed`):

```json
{
  "timestamp": "2026-04-28T09:34:00+07:00",
  "status": 404,
  "error": "Not Found",
  "message": "Student not found with id=42",
  "path": "/api/v1/students/42",
  "violations": null
}
```

`violations` example:

```json
[
  { "field": "email", "message": "must be a well-formed email address" },
  { "field": "credits", "message": "must be greater than or equal to 0" }
]
```

---

## Students

Base path: `/students`

| Method | Path                                          | Description                              | Success |
|--------|-----------------------------------------------|------------------------------------------|---------|
| POST   | `/students`                                   | Create a student                         | 201     |
| GET    | `/students/{id}`                              | Get a student (with enrolled courses)    | 200     |
| GET    | `/students?query=&page=&size=&sort=`          | Search by first/last name (paged)        | 200     |
| PUT    | `/students/{id}`                              | Replace a student                        | 200     |
| DELETE | `/students/{id}`                              | Delete a student                         | 204     |
| POST   | `/students/{studentId}/courses/{courseId}`    | Enroll student in a course               | 200     |
| DELETE | `/students/{studentId}/courses/{courseId}`    | Unenroll student from a course           | 200     |

### Create / update student — request

```json
{
  "studentCode": "S0001",
  "firstName": "Alice",
  "lastName": "Nguyen",
  "email": "alice@example.com",
  "dateOfBirth": "2003-05-14",
  "courseIds": [1, 2]
}
```

Validation:
- `studentCode`: required, max 32, unique
- `firstName`, `lastName`: required, max 80
- `email`: required, valid email, max 160, unique
- `dateOfBirth`: optional, must be in the past
- `courseIds`: optional; all ids must exist

### Student response

```json
{
  "id": 1,
  "studentCode": "S0001",
  "firstName": "Alice",
  "lastName": "Nguyen",
  "email": "alice@example.com",
  "dateOfBirth": "2003-05-14",
  "courses": [
    { "id": 1, "courseCode": "MATH101", "name": "Calculus I" },
    { "id": 2, "courseCode": "CS101",   "name": "Intro to Computer Science" }
  ],
  "createdAt": "2026-04-28T09:34:36.227899",
  "updatedAt": "2026-04-28T09:34:36.227899"
}
```

---

## Courses

Base path: `/courses`

| Method | Path                  | Description           | Success |
|--------|-----------------------|-----------------------|---------|
| POST   | `/courses`            | Create a course       | 201     |
| GET    | `/courses/{id}`       | Get a course          | 200     |
| GET    | `/courses?page=&size=`| List courses (paged)  | 200     |
| PUT    | `/courses/{id}`       | Replace a course      | 200     |
| DELETE | `/courses/{id}`       | Delete a course       | 204     |

### Create / update course — request

```json
{
  "courseCode": "PHY101",
  "name": "Physics I",
  "description": "Mechanics, kinematics, and dynamics",
  "credits": 3
}
```

Validation:
- `courseCode`: required, max 32, unique
- `name`: required, max 160
- `description`: optional, max 500
- `credits`: required, >= 0

### Course response

```json
{
  "id": 1,
  "courseCode": "MATH101",
  "name": "Calculus I",
  "description": "Limits, derivatives, integrals",
  "credits": 4,
  "hasCoverImage": false,
  "coverImageUrl": null,
  "likeCount": 12,
  "commentCount": 3,
  "materialCount": 4,
  "likedByMe": false,
  "createdAt": "2026-04-28T09:34:36.183288",
  "updatedAt": "2026-04-28T09:34:36.183288"
}
```

`likedByMe` is computed from the `X-Client-Id` request header (see "Anonymous identity" below); it is always `false` when the header is absent. `coverImageUrl` is a relative path (e.g. `/courses/1/cover`) you can suffix to the API base to get the bytes.

---

## Anonymous identity (X-Client-Id)

The like / comment features have no login. Instead, **the client must send an `X-Client-Id` header** containing a stable per-browser UUID. The React UI generates one and stores it in `localStorage`. The server uses this value to:

- enforce **one like per (course or comment, client)** — likes are idempotent;
- compute **`likedByMe`** flags on course/comment responses;
- enforce **owner-only edit/delete on comments** — the comment is bound to the `clientId` that created it.

Send it on every request:

```
X-Client-Id: 8f9b3b2c-1a2d-4e6f-9c11-7d2b3e4f5a6b
```

---

## Course covers &amp; materials (file uploads)

Each course can have one **cover image** and any number of **material files** (PDFs, slides, etc.).

| Method | Path                                              | Description                          | Success |
|--------|---------------------------------------------------|--------------------------------------|---------|
| GET    | `/courses/{courseId}/cover`                       | Stream the cover image bytes         | 200     |
| POST   | `/courses/{courseId}/cover`                       | Upload a cover image (multipart)     | 200     |
| DELETE | `/courses/{courseId}/cover`                       | Remove the cover image               | 204     |
| GET    | `/courses/{courseId}/materials`                   | List materials                       | 200     |
| POST   | `/courses/{courseId}/materials`                   | Upload one or more files (multipart) | 200     |
| GET    | `/courses/{courseId}/materials/{matId}/download`  | Download a material                  | 200     |
| DELETE | `/courses/{courseId}/materials/{matId}`           | Delete a material                    | 204     |

Both upload endpoints use `multipart/form-data`:
- cover: form field `file` (single image; `image/*` only)
- materials: form field `files` (one or more files of any type)

Limits are configured in `application.yml` (`spring.servlet.multipart.max-file-size=25MB`, `max-request-size=50MB`). Files are stored under `app.upload-dir` (default `./uploads`).

```bash
# Upload a cover
curl -X POST http://localhost:8080/api/v1/courses/1/cover \
  -F "file=@cover.png"

# Upload several materials
curl -X POST http://localhost:8080/api/v1/courses/1/materials \
  -F "files=@syllabus.pdf" -F "files=@week1.pptx"
```

### Material response

```json
{
  "id": 7,
  "courseId": 1,
  "originalFilename": "syllabus.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 184213,
  "downloadUrl": "/courses/1/materials/7/download",
  "uploadedAt": "2026-04-28T13:01:55.122"
}
```

---

## Comments

Base path: `/courses/{courseId}/comments` and `/comments/{commentId}`

| Method | Path                                       | Description                         | Success |
|--------|--------------------------------------------|-------------------------------------|---------|
| GET    | `/courses/{courseId}/comments?page=&size=` | List comments for a course (paged)  | 200     |
| POST   | `/courses/{courseId}/comments`             | Post a comment                      | 201     |
| PUT    | `/comments/{commentId}`                    | Edit a comment (author-only)        | 200     |
| DELETE | `/comments/{commentId}`                    | Delete a comment (author-only)      | 204     |

The author check is `clientId == comment.clientId`; mismatches return `403 Forbidden`.

### Create / update comment — request

```json
{
  "authorName": "Alice",
  "content": "Loved the lectures, especially week 3!"
}
```

Validation: `authorName` (required, max 80), `content` (required, max 2000).

### Comment response

```json
{
  "id": 5,
  "courseId": 1,
  "authorName": "Alice",
  "content": "Loved the lectures, especially week 3!",
  "likeCount": 2,
  "likedByMe": false,
  "ownedByMe": true,
  "createdAt": "2026-04-28T13:14:01.456",
  "updatedAt": "2026-04-28T13:14:01.456"
}
```

---

## Likes

Likes work the same way for courses and comments — `POST` to like, `DELETE` to unlike, `GET` to check status. All endpoints require `X-Client-Id`.

| Method | Path                              | Success |
|--------|-----------------------------------|---------|
| GET    | `/courses/{courseId}/likes`       | 200     |
| POST   | `/courses/{courseId}/likes`       | 200     |
| DELETE | `/courses/{courseId}/likes`       | 200     |
| GET    | `/comments/{commentId}/likes`     | 200     |
| POST   | `/comments/{commentId}/likes`     | 200     |
| DELETE | `/comments/{commentId}/likes`     | 200     |

All return:

```json
{ "likeCount": 13, "likedByMe": true }
```

---

## Attendance

Base path: `/attendance`

| Method | Path                                                       | Description                                        | Success |
|--------|------------------------------------------------------------|----------------------------------------------------|---------|
| POST   | `/attendance`                                              | Record an attendance entry                         | 201     |
| GET    | `/attendance/{id}`                                         | Get an attendance entry                            | 200     |
| PUT    | `/attendance/{id}`                                         | Replace an attendance entry                        | 200     |
| DELETE | `/attendance/{id}`                                         | Delete an attendance entry                         | 204     |
| GET    | `/attendance/students/{studentId}?page=&size=`             | List a student's attendance (paged)                | 200     |
| GET    | `/attendance/courses/{courseId}?page=&size=`               | List a course's attendance (paged)                 | 200     |
| GET    | `/attendance/courses/{courseId}/sessions?date=YYYY-MM-DD`  | List all entries for a course on a given date      | 200     |
| GET    | `/attendance/students/{studentId}/summary?courseId=`       | Summarize a student's attendance (optional course) | 200     |

A student can have at most one attendance record per `(studentId, courseId, sessionDate)` — duplicates return `409 Conflict`.

### Record / update attendance — request

```json
{
  "studentId": 1,
  "courseId": 2,
  "sessionDate": "2026-04-28",
  "status": "PRESENT",
  "remarks": "Arrived on time"
}
```

Validation:
- `studentId`, `courseId`, `sessionDate`, `status`: all required
- `status`: one of `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`
- `remarks`: optional, max 255

### Attendance response

```json
{
  "id": 10,
  "studentId": 1,
  "studentCode": "S0001",
  "courseId": 2,
  "courseCode": "CS101",
  "sessionDate": "2026-04-28",
  "status": "PRESENT",
  "remarks": "Arrived on time",
  "createdAt": "2026-04-28T09:34:36.238933",
  "updatedAt": "2026-04-28T09:34:36.238933"
}
```

### Attendance summary response

```json
{
  "studentId": 1,
  "courseId": null,
  "totalSessions": 3,
  "counts": {
    "PRESENT": 2,
    "ABSENT": 0,
    "LATE": 1,
    "EXCUSED": 0
  }
}
```

When `courseId` is omitted from the query the summary spans all courses; when provided it scopes to that course only.

---

## Quick smoke test (H2 profile)

```bash
# List seeded students
curl http://localhost:8080/api/v1/students

# List seeded courses
curl http://localhost:8080/api/v1/courses

# Alice's attendance summary
curl http://localhost:8080/api/v1/attendance/students/1/summary

# Record a new attendance entry
curl -X POST http://localhost:8080/api/v1/attendance \
  -H "Content-Type: application/json" \
  -d '{"studentId":1,"courseId":2,"sessionDate":"2026-04-28","status":"PRESENT"}'
```

---

## Project layout

```
src/main/java/com/example/attendance
├── StudentAttendanceApiApplication.java
├── config/         # DevDataSeeder (h2 profile only), StorageConfig, WebConfig (CORS)
├── domain/         # JPA entities: Student, Course, Attendance, AttendanceStatus,
│                   #   CourseMaterial, Comment, CourseLike, CommentLike
├── dto/            # Request / response records (incl. CommentRequest, LikeStatusResponse,
│                   #   CourseMaterialResponse, ...)
├── exception/      # NotFoundException, ConflictException, GlobalExceptionHandler
├── mapper/         # Entity -> DTO mappers
├── repository/     # Spring Data JPA repositories
├── service/        # Business logic (transactional): CourseService, MaterialService,
│                   #   CommentService, LikeService, StorageService, ...
└── web/            # REST controllers (incl. MaterialController, CommentController,
                    #   LikeController)
```

## Storage layout

Uploaded files live under `app.upload-dir` (default `./uploads`):

```
uploads/
└── courses/
    └── {courseId}/
        ├── cover/{uuid}.png        # one cover image (replaces previous on re-upload)
        └── materials/{uuid}.pdf    # one file per material; original filename preserved
                                    #   in the DB and used as the download filename
```

Deleting a course removes its row, all comments / comment likes / course likes / materials,
**and** every uploaded file from disk.

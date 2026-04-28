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
  "createdAt": "2026-04-28T09:34:36.183288",
  "updatedAt": "2026-04-28T09:34:36.183288"
}
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
├── config/         # DevDataSeeder (h2 profile only)
├── domain/         # JPA entities: Student, Course, Attendance, AttendanceStatus
├── dto/            # Request / response records
├── exception/      # NotFoundException, ConflictException, GlobalExceptionHandler
├── mapper/         # Entity -> DTO mappers
├── repository/     # Spring Data JPA repositories
├── service/        # Business logic (transactional)
└── web/            # REST controllers
```

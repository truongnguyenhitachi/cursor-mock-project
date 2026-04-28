# Student Attendance UI

A React + TypeScript admin console for the
[`student-attendance-api`](../student-attendance-api) Spring Boot service.
It provides a modern UI to manage students, courses, enrollments and
attendance, plus per‑student attendance summaries.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [React Router v7](https://reactrouter.com/) for routing
- [Axios](https://axios-http.com/) for HTTP calls
- Plain modern CSS (no UI framework) with a clean design system

## Features

- **Dashboard** — KPI cards (students / courses / today's sessions /
  present today), recently added students, today's attendance feed.
- **Students** — paginated list with debounced search, create / edit /
  delete, and an enrollment manager to add or remove a student from
  courses.
- **Courses** — card grid with cover thumbnails, like / comment /
  material counts, create / edit / delete from the card, and links into
  a per‑course detail page.
- **Course detail** — upload a cover image, drag‑and‑drop one or more
  **material files** (PDFs, slides, images), download or delete them,
  **like / unlike the course**, post **comments** (with author name),
  and **like comments**. Comments you posted from this browser show a
  Delete action.
- **Attendance** — pick a course + date to view recorded attendance,
  one‑click "quick mark" for any enrolled student, full create / edit /
  delete dialogs, and a per‑student attendance summary (optionally
  filtered by course) with a percentage breakdown.
- Reusable toast notifications, modal dialog, confirm dialog, and
  pagination components.
- Responsive layout that collapses the sidebar on narrow screens.

## Anonymous identity

The API has no login. Likes and comments are tied to a per‑browser
**`X-Client-Id`** UUID that the UI generates on first run and stores in
`localStorage` (key `student-attendance-ui:client-id`). It is sent
automatically as a header on every API request, so:

- you can like / unlike from this browser exactly once;
- the UI knows whether *you* liked something (`likedByMe`);
- comments you posted from this browser show a delete action; comments
  from other browsers don't.

To "switch identity" for testing, clear the key from your browser
storage (or open a different browser).

## Getting started

### 1. Run the API

From the sibling project:

```bash
cd ../student-attendance-api
./mvnw spring-boot:run
```

The API listens on `http://localhost:8081/api/v1` (see
`student-attendance-api/src/main/resources/application.yml`).

### 2. Run the UI

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

In dev mode, the UI calls relative URLs under `/api/v1/*`. Vite's dev
server proxies those to `http://localhost:8081` (see `vite.config.ts`),
so there is no CORS configuration to worry about.

### 3. Build for production

```bash
npm run build
npm run preview
```

For production deployments, point the UI at a deployed API by setting
`VITE_API_BASE_URL` in a `.env` file (see `.env.example`):

```
VITE_API_BASE_URL=https://your-api.example.com/api/v1
```

## Available scripts

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 5173        |
| `npm run build`   | Type-check (`tsc -b`) and produce a prod build |
| `npm run preview` | Preview the production build locally          |
| `npm run lint`    | Run ESLint over the project                   |

## Project layout

```
src/
├── api/               # Axios client and per-resource API modules
│   ├── client.ts      # base axios + getClientId() + apiUrl() + extractApiError()
│   ├── students.ts
│   ├── courses.ts
│   ├── attendance.ts
│   ├── materials.ts   # course cover + material file uploads / downloads
│   ├── comments.ts    # course comments (CRUD)
│   └── likes.ts       # like / unlike for courses and comments
├── components/        # Reusable UI primitives
│   ├── Layout.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── Pagination.tsx
│   └── Toast.tsx
├── pages/             # Routed pages
│   ├── Dashboard.tsx
│   ├── Students.tsx
│   ├── Courses.tsx
│   ├── CourseDetail.tsx
│   └── Attendance.tsx
├── styles/app.css     # Application styles / design system
├── types.ts           # Shared TypeScript types matching backend DTOs
├── App.tsx            # Routes
└── main.tsx           # React bootstrap
```

## API endpoints used

The UI uses the following endpoints exposed by the Spring Boot service.
All URLs are relative to `/api/v1`.

### Students
- `GET /students` (with `query`, `page`, `size`, `sort`)
- `POST /students`
- `GET /students/{id}`
- `PUT /students/{id}`
- `DELETE /students/{id}`
- `POST /students/{studentId}/courses/{courseId}` — enroll
- `DELETE /students/{studentId}/courses/{courseId}` — unenroll

### Courses
- `GET /courses` (with paging) — returns counts + `coverImageUrl` + `likedByMe`
- `POST /courses`
- `GET /courses/{id}`
- `PUT /courses/{id}`
- `DELETE /courses/{id}` — also removes related comments, likes, materials

### Course covers &amp; materials
- `GET /courses/{id}/cover` — image bytes (used directly as `<img src>`)
- `POST /courses/{id}/cover` (multipart, field `file`) — set / replace
- `DELETE /courses/{id}/cover` — remove
- `GET /courses/{id}/materials` — list
- `POST /courses/{id}/materials` (multipart, field `files`) — upload one or more
- `GET /courses/{id}/materials/{matId}/download` — stream original bytes
- `DELETE /courses/{id}/materials/{matId}`

### Comments
- `GET /courses/{id}/comments?page=&size=`
- `POST /courses/{id}/comments`
- `PUT /comments/{commentId}` — author-only (validated by `X-Client-Id`)
- `DELETE /comments/{commentId}` — author-only

### Likes
- `GET /courses/{id}/likes`
- `POST /courses/{id}/likes` / `DELETE /courses/{id}/likes`
- `GET /comments/{commentId}/likes`
- `POST /comments/{commentId}/likes` / `DELETE /comments/{commentId}/likes`

### Attendance
- `POST /attendance`
- `GET /attendance/{id}`
- `PUT /attendance/{id}`
- `DELETE /attendance/{id}`
- `GET /attendance/students/{studentId}` (paged)
- `GET /attendance/courses/{courseId}` (paged)
- `GET /attendance/courses/{courseId}/sessions?date=YYYY-MM-DD`
- `GET /attendance/students/{studentId}/summary?courseId=…`

# Student Itinerary App — Product, Architecture & Database Schema

**Department scope:** Software Engineering (5 levels: 100L–500L)
**Status:** Locked spec, pre-build

---

# 1. PRODUCT

## 1.1 Problem

Students juggle assignments, tests, special lectures, and announcements scattered across WhatsApp groups, verbal class updates, and memory. There is no single, trusted source of truth. Information gets missed, deadlines sneak up, and students only find out about things if they happened to be in the right group chat at the right time.

## 1.2 Overview

A centralized, level-based academic itinerary app for a Software Engineering department. Each level (100L–500L) is a self-contained space where the department's Course Reps post verified announcements, deadlines, and updates, and every student in that level automatically sees them. Students also get a private, AI-assisted personal planner layered on top, plus static department resources and a self-service CGPA calculator.

## 1.3 Solution

Instead of information scattered across informal channels, it lives in one structured space per level:

- Verified posting — only onboarded, admin-approved Course Reps (CRs) can post, so information is trustworthy by design.
- Level-wide visibility — every student in a level automatically receives every CR post for that level; no manual per-course enrollment needed, since all students in a level share the same courses.
- Personal AI planning — students can privately add their own tasks (typed), and AI arranges them by difficulty to help reduce last-minute stress.
- Persistent resources — course materials live in a static, admin-managed library that survives CR turnover and session changes.

## 1.4 Roles

| Role                | Description                                                                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**           | Onboards/verifies CRs, manages courses (code, title, credit unit), manages Resources, triggers level promotion at session end, toggles the global semester state                                                                                      |
| **Course Rep (CR)** | Up to 3 per level (1 Main CR + up to 2 Assistant CRs). Main CR has extra power (can edit/remove Assistant posts, manage courses). Posts announcements tagged to a course with optional difficulty. Can edit Resources. Receives comments in an inbox. |
| **Student**         | Belongs to exactly one level at a time (auto-mapped via join code at signup). Views level-wide posts, calendar, Resources (scoped to their level+current semester), personal itinerary, CGPA calculator. Can comment on CR posts.                     |

## 1.5 Core Concepts

- **Level = Space.** Not per-course rooms — one shared space per level (100L, 200L, 300L, 400L, 500L), since all students in a level take the same set of 10–12 courses.
- **Join code.** CR signs up first and is verified by admin. On approval, a join code is generated, tied to that CR's level. Students enter the code at signup and are automatically mapped to that level — no separate per-course enrollment.
- **Semester is a global toggle**, not a per-record label. Admin flips the system between 1st/2nd Semester; this changes what Courses, Posts, and Resources everyone sees app-wide.
- **Promotion is manual.** At session end, admin triggers a "Promote" action that moves all active students up one level. Carryover/repeat cases are explicitly out of scope — the system doesn't track or handle them differently.
- **Soft-delete on promotion.** A student's/CR's prior level assignment isn't deleted — it's archived (status flipped to inactive) so history remains available, organized by "1st Semester 100L," "2nd Semester 200L," etc.

## 1.6 MVP (v1) Features

**Core spine (must-have):**

- Auth & role-based access (Admin, CR, Student)
- Level spaces with join-code-based onboarding (auto level mapping)
- Courses (code, title, credit unit) — set by Admin or CR
- CR posts: course-tagged, optional Easy/Medium/Hard difficulty, triggers push notification to entire level
- Calendar view (daily + semester)
- Deadline countdowns

**Included in MVP:**

- **Resources** — static, admin-managed, CR-editable, structured Level → Semester → Course → Materials; students view-only, scoped to their level + current semester
- **CGPA Calculator** — manual entry (course code, title, grade) per semester; system pulls credit unit from Courses and computes GPA/CGPA; no result uploads
- **AI Smart Planning** — students type personal tasks; AI (Groq) arranges them by difficulty; students can manually adjust difficulty on their own tasks
- **Comments on posts** — students comment under a CR post; routed to the CR's inbox (not a public thread); CR gets a push notification per comment, same priority as posts

**Explicitly deferred to v2:**

- Voice-to-itinerary input (typed-only for MVP)
- Any open/public chat system

## 1.7 Notification Rules

| Event                        | Recipient    | Channel    |
| ---------------------------- | ------------ | ---------- |
| CR creates a post            | Entire level | Push (FCM) |
| Student comments on a post   | Post's CR    | Push (FCM) |
| Personal itinerary reminders | The student  | Push (FCM) |

## 1.8 Out of Scope (by design decision)

- Result/grade uploads or automated grade pulling
- Carryover/repeat-student tracking
- Per-course enrollment (level membership implies all courses)
- Public/open chat between students
- 100L elective handling as a distinct system concern (majority of courses are shared; treated as a non-issue for now)

---

# 2. ARCHITECTURE

## 2.1 Tech Stack Summary

| Layer                    | Choice                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| Frontend (mobile)        | React Native                                                              |
| Frontend (web)           | React Native Web (shared codebase)                                        |
| Backend                  | Node.js + Express                                                         |
| Database                 | PostgreSQL                                                                |
| Auth                     | Custom JWT (access + refresh tokens)                                      |
| Push notifications       | Firebase Cloud Messaging (FCM)                                            |
| AI (smart planning)      | Groq API (with fallback-provider design, since AI is assistive, not core) |
| File storage (Resources) | AWS S3 or Cloudinary                                                      |
| Hosting                  | Render                                                                    |

## 2.2 High-Level System Flow

```
┌─────────────────────┐        ┌─────────────────────┐
│   React Native App    │        │  React Native Web     │
│   (iOS / Android)      │        │  (browser)             │
└───────────┬──────────┘        └───────────┬──────────┘
            │                                │
            └───────────────┬────────────────┘
                             │ REST API (HTTPS, JWT auth)
                             ▼
                 ┌───────────────────────┐
                 │  Node.js / Express API  │
                 │  (hosted on Render)      │
                 └──────────┬────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│  PostgreSQL     │   │  Groq API        │   │  FCM (push)        │
│  (primary DB)   │   │  (AI planning)   │   │                    │
└───────────────┘   └────────────────┘   └──────────────────┘
        │
        ▼
┌───────────────────┐
│  S3 / Cloudinary     │
│  (Resources files)   │
└───────────────────┘
```

## 2.3 Backend Module Breakdown

- **auth/** — signup (student/CR), login, JWT issue/refresh, password hashing (bcrypt)
- **users/** — profile management, role handling
- **levels/** — level CRUD (admin), join-code generation/regeneration/validation
- **courses/** — course CRUD (admin/CR), scoped by level + semester
- **posts/** — CR post creation, course-tagging, difficulty tagging, triggers FCM push
- **comments/** — comment creation, routes to CR inbox, triggers FCM push
- **resources/** — file upload/link management (admin/CR write, student/CR read), scoped by level + semester + course
- **itinerary/** — personal task CRUD, AI-arrangement calls to Groq
- **cgpa/** — grade entry CRUD, GPA/CGPA calculation using course credit units
- **semester/** — global semester-state toggle (admin only)
- **promotion/** — manual level-promotion action (admin only), archives old level assignments
- **notifications/** — FCM dispatch service, notification logs

## 2.4 Auth Flow

1. **CR signup** → account created with `verification_status = pending` → admin reviews and approves/rejects → on approval, a join code is generated and tied to the CR's level.
2. **Student signup** → enters join code → validated against active codes → auto-assigned to the corresponding level → account active immediately (no admin approval needed).
3. **Login** (all roles) → email + password → JWT access token (short-lived) + refresh token (longer-lived) issued.
4. **Protected routes** → middleware validates JWT and checks role (RBAC: admin / main_cr / assistant_cr / student) before allowing access to role-specific endpoints (e.g., only admin can trigger promotion; only CR roles can create posts).

## 2.5 Key Architectural Decisions

- **Level as the primary partition.** Nearly every entity (courses, posts, resources) is scoped by `level_id` (+ current semester), which keeps queries simple and access control straightforward — a student's visibility is entirely determined by their active level membership.
- **Global semester as a singleton state**, not a per-row label, so admin flips one switch and every level's Courses/Posts/Resources view updates app-wide without touching individual records.
- **Soft-delete over hard-delete** for level memberships, enabling promotion history/archives without complex versioning.
- **AI kept at the edges.** Groq is only called for personal itinerary arrangement — it never touches CR posts, courses, or core data integrity, keeping the core product usable even if the AI provider has downtime.
- **Push-first notifications**, since the app's core value (not missing deadlines) depends on real-time delivery, not passive in-app checking.

## 2.6 Security Considerations

- Passwords hashed with bcrypt; JWTs signed with a rotating secret.
- Join codes are rate-limited on validation attempts to prevent brute-forcing.
- CR post/edit/delete endpoints check `role_in_level` (main_cr has elevated permissions over assistant_cr).
- File uploads to S3/Cloudinary are validated by type/size before accepting.
- All admin-only actions (promotion, semester toggle, CR verification) are gated by role middleware, not just UI hiding.

---

# 3. DATABASE SCHEMA (PostgreSQL)

## 3.1 Entity Overview

```
users ──< level_memberships >── levels ──< join_codes
  │                                │
  │                                ├──< courses ──< posts ──< comments
  │                                │         │
  │                                └──< resources
  │
  ├──< itinerary_items
  ├──< grade_entries
  └──< notifications

academic_session_state (singleton)
promotion_events (audit log)
```

## 3.2 Table Definitions

### `users`

| Column              | Type                                            | Notes              |
| ------------------- | ----------------------------------------------- | ------------------ |
| id                  | UUID (PK)                                       |                    |
| full_name           | VARCHAR                                         |                    |
| email               | VARCHAR, unique                                 |                    |
| password_hash       | VARCHAR                                         | bcrypt             |
| global_role         | ENUM('admin','cr','student')                    |                    |
| verification_status | ENUM('pending','approved','rejected'), nullable | applies to CR only |
| is_active           | BOOLEAN                                         | default true       |
| created_at          | TIMESTAMP                                       |                    |
| updated_at          | TIMESTAMP                                       |                    |

### `levels`

| Column     | Type      | Notes               |
| ---------- | --------- | ------------------- |
| id         | UUID (PK) |                     |
| name       | VARCHAR   | e.g. "100L", "200L" |
| created_at | TIMESTAMP |                     |

### `level_memberships`

Tracks a user's association with a level over time — handles both students and CRs, supports promotion history via soft-delete.

| Column        | Type                                     | Notes                 |
| ------------- | ---------------------------------------- | --------------------- |
| id            | UUID (PK)                                |                       |
| user_id       | UUID (FK → users.id)                     |                       |
| level_id      | UUID (FK → levels.id)                    |                       |
| role_in_level | ENUM('student','main_cr','assistant_cr') |                       |
| status        | ENUM('active','archived')                | archived on promotion |
| joined_at     | TIMESTAMP                                |                       |
| archived_at   | TIMESTAMP, nullable                      |                       |

### `join_codes`

| Column     | Type                  | Notes                                |
| ---------- | --------------------- | ------------------------------------ |
| id         | UUID (PK)             |                                      |
| level_id   | UUID (FK → levels.id) |                                      |
| code       | VARCHAR, unique       |                                      |
| created_by | UUID (FK → users.id)  | admin or CR who generated it         |
| is_active  | BOOLEAN               | old code invalidated on regeneration |
| created_at | TIMESTAMP             |                                      |

### `academic_session_state` (singleton row)

| Column               | Type                 | Notes            |
| -------------------- | -------------------- | ---------------- |
| id                   | UUID (PK)            | single row       |
| current_semester     | ENUM('1st','2nd')    |                  |
| current_session_year | VARCHAR              | e.g. "2025/2026" |
| updated_by           | UUID (FK → users.id) | admin            |
| updated_at           | TIMESTAMP            |                  |

### `courses`

| Column       | Type                  | Notes                   |
| ------------ | --------------------- | ----------------------- |
| id           | UUID (PK)             |                         |
| level_id     | UUID (FK → levels.id) |                         |
| semester     | ENUM('1st','2nd')     |                         |
| course_code  | VARCHAR               | e.g. "CSC 301"          |
| course_title | VARCHAR               |                         |
| credit_unit  | INTEGER               | used by CGPA calculator |
| created_by   | UUID (FK → users.id)  | admin or CR             |
| created_at   | TIMESTAMP             |                         |

### `posts`

| Column     | Type                                               | Notes         |
| ---------- | -------------------------------------------------- | ------------- |
| id         | UUID (PK)                                          |               |
| course_id  | UUID (FK → courses.id)                             | mandatory tag |
| cr_id      | UUID (FK → users.id)                               | author        |
| title      | VARCHAR                                            |               |
| content    | TEXT                                               |               |
| post_type  | ENUM('assignment','test','lecture','announcement') |               |
| difficulty | ENUM('easy','medium','hard'), nullable             | optional      |
| due_date   | TIMESTAMP, nullable                                |               |
| created_at | TIMESTAMP                                          |               |

### `comments`

| Column     | Type                 | Notes                         |
| ---------- | -------------------- | ----------------------------- |
| id         | UUID (PK)            |                               |
| post_id    | UUID (FK → posts.id) |                               |
| student_id | UUID (FK → users.id) |                               |
| content    | TEXT                 |                               |
| is_read    | BOOLEAN              | default false, CR inbox state |
| created_at | TIMESTAMP            |                               |

### `resources`

| Column      | Type                   | Notes              |
| ----------- | ---------------------- | ------------------ |
| id          | UUID (PK)              |                    |
| level_id    | UUID (FK → levels.id)  |                    |
| semester    | ENUM('1st','2nd')      |                    |
| course_id   | UUID (FK → courses.id) |                    |
| title       | VARCHAR                |                    |
| file_url    | VARCHAR                | S3/Cloudinary link |
| file_type   | VARCHAR                | e.g. "pdf", "docx" |
| uploaded_by | UUID (FK → users.id)   | admin or CR        |
| created_at  | TIMESTAMP              |                    |

### `itinerary_items` (personal, private)

| Column            | Type                         | Notes                          |
| ----------------- | ---------------------------- | ------------------------------ |
| id                | UUID (PK)                    |                                |
| student_id        | UUID (FK → users.id)         |                                |
| title             | VARCHAR                      |                                |
| raw_input_text    | TEXT                         | original typed input           |
| difficulty        | ENUM('easy','medium','hard') | AI-suggested, student-editable |
| scheduled_date    | DATE, nullable               |                                |
| ai_arranged_order | INTEGER, nullable            | sort order from AI planning    |
| status            | ENUM('pending','done')       | default pending                |
| created_at        | TIMESTAMP                    |                                |

### `grade_entries` (CGPA calculator)

| Column         | Type                          | Notes                                             |
| -------------- | ----------------------------- | ------------------------------------------------- |
| id             | UUID (PK)                     |                                                   |
| student_id     | UUID (FK → users.id)          |                                                   |
| course_code    | VARCHAR                       | manually entered                                  |
| course_title   | VARCHAR                       | manually entered                                  |
| credit_unit    | INTEGER                       | pulled from courses table if matched, else manual |
| grade          | ENUM('A','B','C','D','E','F') |                                                   |
| grade_point    | DECIMAL                       | computed (e.g. A=5, B=4, C=3, D=2, E=1, F=0)      |
| semester_label | VARCHAR                       | e.g. "1st Semester 200L"                          |
| created_at     | TIMESTAMP                     |                                                   |

### `promotion_events` (audit log)

| Column            | Type                 | Notes |
| ----------------- | -------------------- | ----- |
| id                | UUID (PK)            |       |
| triggered_by      | UUID (FK → users.id) | admin |
| from_session_year | VARCHAR              |       |
| to_session_year   | VARCHAR              |       |
| created_at        | TIMESTAMP            |       |

### `notifications` (delivery log)

| Column       | Type                   | Notes                 |
| ------------ | ---------------------- | --------------------- |
| id           | UUID (PK)              |                       |
| user_id      | UUID (FK → users.id)   | recipient             |
| type         | ENUM('post','comment') |                       |
| reference_id | UUID                   | post_id or comment_id |
| is_read      | BOOLEAN                | default false         |
| sent_at      | TIMESTAMP              |                       |

## 3.3 Key Relationships & Rules

- A `user` can have multiple `level_memberships` over time, but only **one active** membership at a time (enforced at application level).
- `join_codes` are always tied to a `level`; regenerating a code sets the old one's `is_active = false` rather than deleting it (audit trail).
- `courses`, `posts`, and `resources` are always filtered by the current value in `academic_session_state.current_semester` when queried for students/CRs.
- Promotion (`promotion_events`) archives all `active` student `level_memberships` and creates new ones at the next level — CR memberships are handled separately (not auto-promoted, since CRs are role-specific to a level by verification, not by cohort progression).
- `grade_entries.credit_unit` is normally pulled from `courses` by matching `course_code`, but stored redundantly on the entry itself so CGPA history remains accurate even if a course record later changes.

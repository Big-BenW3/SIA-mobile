# SIA Frontend — Final Plan (living doc)

Status: UI complete against stubs. This file supersedes the drifted parts of
`Build-Plan.md` / `App-Flow.md` where they conflict (theme, tabs, CGPA, Test).

## 1. Locked decisions

| Area           | Decision                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand          | Midnight `#131F45` / `#0B1330`, Sora 400+700, Logo C (Cap Signal)                                                                                                                              |
| Theme          | Light + Dark via `ThemeContext` (Light/Dark/System); `theme` live proxy; never hard-code a colour; `text`↔`onPrimary` never paired (see `inverseSurface` rule in `theme.ts`)                   |
| Nav            | Expo Router, Stack-over-Tabs (details slide above tabs, never _are_ tabs)                                                                                                                      |
| Tabs (student) | Home · Plan · Files · Test · You                                                                                                                                                               |
| Tabs (CR)      | Home · Post(=Post\|Plan segments) · Files · Test · You                                                                                                                                         |
| CGPA           | Lives behind Profile (both roles), not a tab                                                                                                                                                   |
| CR = student   | Shared bodies with `base` prop; Post tab is the only CR-exclusive surface                                                                                                                      |
| Data           | Neon Postgres (shared) + on-device personal DB (tasks, grades, goals — never synced). Native: expo-sqlite + Drizzle. Web: same API over memory (non-persistent) — expo-sqlite has no web build |
| Icons/imagery  | Drawn SVG only, zero emoji; remote Unsplash heroes with midnight fallback                                                                                                                      |

## 2. Route map

```
app/_layout.tsx                    → QueryClient + AuthGate + NotificationPanel
app/(auth)/                        → welcome, login, signup-student, signup-cr,
                                      pending-approval (__DEV__ simulate only),
                                      forgot-password (v2 stub), onboarding
app/(student)/_layout              → Stack: (tabs) + post/[id] + calendar +
                                      itinerary/* + resources/* + cgpa/* + test/*
app/(student)/(tabs)/              → index(Home) + itinerary + resources + test + profile
app/(cr)/_layout                   → Stack: (tabs) + post/[id] + calendar +
                                      posts/new + posts/[id]/edit + itinerary/* +
                                      resources/* + test/* + cgpa/*
app/(cr)/(tabs)/                   → index(Home) + posts(Post|Plan merge) +
                                      resources + test + profile
```

## 3. Shared bodies (`components/`, both roles, `base` prop)

| Component                                                       | Used by                                     | State                                             |
| --------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `itinerary/PlannerList`                                         | student tab, CR Post\|Plan page             | `plannerStore`                                    |
| `itinerary/AddTask`, `TaskDetail`                               | both groups (thin wrappers)                 | `plannerStore`                                    |
| `post/MyPostsBody`                                              | CR Post page                                | `postsStore`                                      |
| `test/TestHub`                                                  | both Test tabs                              | local funnel                                      |
| `test/study\|cbt\|past`                                         | student routes; CR re-exports (back()-only) | `useBankQuestions` async loader                   |
| `cgpa/CgpaOverview`, `SemesterForm`, `SemesterDetail`           | both groups (thin wrappers)                 | `cgpaStore`                                       |
| `calendar/CalendarBody`                                         | both groups (thin wrappers)                 | `postsStore` + `plannerStore`                     |
| `test/TestSetup` (course → paper → topics) + `useBankQuestions` | shared by all modes                         | `questions.service` (API-first, offline fallback) |

Role-exclusive screens: `post/[id]` detail (composer vs Edit/Delete+reply),
`posts/new`, `posts/[id]/edit`, CR upload sheet. Everything else is shared.

## 4. Stub → backend contract

| Store (now)                   | Endpoints (later)                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plannerStore`                | `GET/POST /api/itinerary`, `PATCH/DELETE /api/itinerary/:id`, `POST /api/itinerary/arrange` (Groq)                                                            |
| `postsStore` (+`draft`)       | `GET /api/posts?level=`, `POST/PATCH/DELETE /api/posts…`, `GET/POST /api/posts/:id/comments`, push on publish                                                 |
| `cgpaStore` (+`gpaFor`)       | ON-DEVICE ONLY — no endpoints, ever (product decision)                                                                                                        |
| `authStore`                   | `POST /api/auth/*` (JWT + refresh), join-code validate, CR verify                                                                                             |
| `notificationStore` (readIds) | FCM registration + delivery log                                                                                                                               |
| Mocks kept direct             | `MOCK_COURSES/FILES` → courses/resources endpoints; `MOCK_HEROES/SCHEDULE/ACADEMIC_STATE` → CMS/session endpoints; `data/questions` → question-bank endpoints |

Rule: screens never import fetch logic — only stores/hooks. Backend lands by
rewriting store internals; UI stays untouched.

## 5. Screen-state contract (definition of done)

Every screen: **loading** (busy buttons/spinners on stub latency),
**empty** (guidance + CTA, reachable), **error** (inline validation +
`ErrorState` with retry/back, incl. 404 for bad ids — never silent
fallbacks), **success** (banner/confirm, never silent). Optimistic only for
toggles/sends, with rollback path. Destructive actions always confirm.

## 6. No-mock rule (enforced)

- `data/mocks.ts` is deleted. No screen imports mock data, no fake
  `setTimeout` latency, no `__DEV__` backdoors, no silent fallbacks.
- Deliberate local data only: `data/content.ts` (editorial carousel copy),
  `data/questions.ts` (offline question fallback, API-first), SQLite
  personal tables, composer drafts.
- Dates: backend ISO timestamps render as countdowns (`utils/due.ts`);
  free-text labels pass through untouched.

## 7. Backend + storage (built — see backend/README.md)

Bun + Hono + Drizzle + Neon Postgres. Grades/goals/tasks stay on-device
(§4); Groq stays edge-only (`POST /arrange`); push relays through Expo
(no firebase-admin); files in Cloudinary. Open: hosting choice (post-build).

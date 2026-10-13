# App Flow — Student Itinerary App

Three experiences: **Student App**, **CR App** (same Expo codebase, role-gated), **Admin Dashboard** (separate web app).
Navigation pattern: bottom tabs (mobile) / side rail (wide web) via React Navigation + React Native Web — one nav tree, responsive by viewport. Admin uses a sidebar layout instead (desk-like work, not tab-based).

Every role (Student, CR, Admin) has a **notification bell in the header** — not a tab. No separate inbox screen for CRs; comments route into the same notification system as everyone else.

---

# 1. STUDENT APP FLOW

## Entry: Auth
**Screen: Welcome**
- Buttons: Sign Up, Log In

**Screen: Sign Up (Student)**
- Fields: Full name, email, password, confirm password, **Join Code**
- On submit: validates join code → maps student to the code's level → account created and active immediately (no admin approval)
- Button: Create Account → on success, goes straight to Home
- Error state: invalid/inactive code → inline error, no account created

**Screen: Log In**
- Fields: email, password
- Button: Log In → issues JWT access + refresh token → Home
- Link: Forgot password (v2 — flag as future, not required MVP but stub screen can exist)

## Header (persistent, all screens)
- Left: App logo/name
- Right: 🔔 Notification bell (badge count for unread) → **Notification Panel** (dropdown/sheet, not a tab)
  - List: post notifications, comment replies (N/A for students — they don't get comment notifications, only CRs do), system messages
  - Tap a notification → deep-links to the relevant Post Detail

---

## TAB 1: Home
**Screen: Level Feed** (default landing screen after login)
- Header sub-bar: current level name (e.g. "300L"), current semester label
- List: CR posts, newest first. Each card shows: course tag, post type icon, difficulty badge (if set), title snippet, due-date countdown (e.g. "Due in 2 days")
- Controls: Filter chip row — All / Assignment / Test / Lecture / Announcement; Course dropdown filter
- Empty state: "No posts yet this semester" if feed is empty
- Tap a card → **Post Detail**

**Screen: Post Detail**
- Full post: title, course, type, difficulty badge, due date, full content, author (CR name)
- Comments section below: list of comments (student's own comments visible; this is not a public thread — only the commenting student and the CR see the exchange, per the "routes to CR inbox" design)
- Input: "Add a comment" text field + Send button → posts to `comments`, triggers notification to the post's CR
- Button: Back to feed

**Screen: Calendar View** (reached via a calendar icon in the Home tab's top bar, not a separate tab)
- Toggle: **Daily** / **Semester**
- Daily mode: vertical timeline for the selected date, merging CR posts (deadlines) + personal itinerary items into one list; date picker/strip at top to change day
- Semester mode: month grid, dots/markers on dates with items; tap a date jumps into Daily mode for that date
- Tap any item → Post Detail (if CR post) or Itinerary Item Detail (if personal task)

---

## TAB 2: Itinerary
**Screen: My Itinerary**
- List of personal tasks, ordered by `ai_arranged_order` (difficulty-weighted sequencing)
- Each row: title, difficulty badge (color-coded: green/yellow/red), scheduled date (if set), checkbox to mark done
- Floating button: **+ Add Task**
- Empty state: "Nothing planned yet — add your first task"
- Swipe actions: Mark done, Delete

**Screen: Add Task**
- Field: multi-line text input — "What do you need to do?" (typed only in MVP)
- Optional field: scheduled date picker
- Button: **Arrange with AI** → sends text to backend → Groq returns suggested difficulty + placement in the list → task saved with AI-suggested difficulty (student can still edit after)
- Button: **Save without AI** → task saved with difficulty defaulted to "Medium," fully student-editable
- Button: Cancel

**Screen: Task Detail**
- Title, difficulty (editable — tap to change Easy/Medium/Hard), scheduled date (editable), status
- Buttons: Save changes, Delete task, Mark complete / Mark incomplete

---

## TAB 3: Resources
**Screen: Resources Home**
- Auto-scoped: shows only the student's current level + current global semester (no manual selection)
- List: all courses for that level/semester, each showing course code + title
- Tap a course → **Course Resources**

**Screen: Course Resources**
- List of files for that course (title, file type icon, upload date)
- Tap a file → opens/downloads via device viewer or in-app preview
- Empty state: "No resources uploaded yet for this course"
- Read-only for students (no upload/delete controls)

---

## TAB 4: CGPA Calculator
**Screen: CGPA Overview**
- Large display: current computed CGPA
- List: semesters entered so far, each showing semester label + that semester's GPA
- Button: **+ Add Semester**
- Tap a semester row → **Semester Detail**

**Screen: Add/Edit Semester Entry**
- Semester label field (e.g. "1st Semester 300L")
- Repeatable row group, one per course: Course code (text or dropdown-matched to real course), Course title (auto-filled if matched), Grade (dropdown A/B/C/D/E/F), Credit unit (auto-filled if matched, editable if not)
- Button: **+ Add course row**
- Button: **Save & Calculate** → computes GPA for that semester using grade-point mapping (A=5...F=0) × credit unit, updates overall CGPA
- Button: Delete semester entry

---

## TAB 5: Profile
**Screen: Profile**
- Display: full name, email, current level (read-only)
- Buttons: Notification preferences (toggle categories on/off), Change password, **Log Out**

---

# 2. CR APP FLOW

Same shell (header with notification bell), same Expo codebase, role-gated to show CR-specific tabs. A CR is still a level member, so Home/Itinerary/Resources behave like the student version **plus** extra permissions and one extra tab (Post).

## Entry: Auth
**Screen: Sign Up (CR)**
- Fields: Full name, email, password, confirm password, **Level requested** (dropdown, since CR doesn't have a join code yet — they're requesting to be verified for a level)
- On submit: account created with `verification_status = pending`
- Screen: **Pending Approval** — shown instead of the app shell until admin approves. Message: "Your CR request for [Level] is under review."
- On admin approval (detected on next login/refresh): full CR app unlocks, join code becomes active for their level

## TAB 1: Home
Identical structure to student's Home (Level Feed + Post Detail + Calendar), **except**:
- On own posts (or any post, if Main CR): Post Detail shows Edit/Delete buttons directly in the card, not just view
- Comments on own posts trigger a notification to this CR

## TAB 2: Post (CR-only tab)
**Screen: My Posts**
- List of posts authored by this CR (and, if Main CR, a toggle to view "All level posts" including Assistant CRs')
- Status tag per post: Upcoming / Past due
- Floating button: **+ New Post**
- Tap a post → **Edit Post**

**Screen: New Post**
- Field: Course (dropdown, mandatory — pulled from this level's current-semester course list)
- Field: Post type (dropdown: Assignment / Test / Lecture / Announcement)
- Field: Title
- Field: Content (multi-line)
- Field: Due date (optional, date picker)
- Field: Difficulty (optional dropdown: Easy / Medium / Hard — helper text: "Leave blank if not applicable, e.g. for a simple date announcement")
- Button: **Post** → publishes, auto-triggers push notification to entire level
- Button: Save as draft (local, not yet published)
- Button: Cancel

**Screen: Edit Post**
- Same fields, pre-filled
- Button: Save changes
- Button: **Delete post** (own posts always; any post in the level, if this CR is Main CR)

## TAB 3: Itinerary
Identical to student's Itinerary tab (private, personal, AI-arranged planner) — a CR's own tasks are separate from their posting duties.

## TAB 4: Resources
Same structure as student's Resources, **plus edit rights**:
- **Course Resources** screen adds: Button **+ Upload file** (opens file picker → uploads to S3/Cloudinary → creates a `resources` record)
- Delete button on each file (own uploads always; any file, if Main CR)

## TAB 5: Profile
- Display: full name, email, level, **role badge** (Main CR / Assistant CR)
- Button: **CGPA Calculator** (same tool as student, placed here to keep tab count at 5)
- Buttons: Notification preferences, Change password, Log Out

---

# 3. ADMIN DASHBOARD FLOW (Web-only, sidebar layout)

Not built on the same tab pattern — this is a desk-oriented dashboard, separate web app, sidebar navigation.

## Entry: Auth
**Screen: Admin Login**
- Fields: email, password (admin accounts are seeded/created directly, not via public signup)
- Button: Log In → Dashboard Overview

## Sidebar Layout (persistent left rail)
- Overview
- CR Verification
- Levels & Courses
- Resources
- Session Control
- Analytics
- Settings
- Header (top bar, all screens): 🔔 Notification bell, admin name/avatar dropdown → Logout

## Section: Overview
**Screen: Dashboard Home**
- Stat cards: Total students, Total CRs, Pending verifications, Active levels (5), Current semester
- Chart: Post volume per level (bar chart, this week/month toggle)
- Chart: Student engagement (logins, itinerary usage, comment volume over time)
- Each card/chart is clickable → drills into the matching detailed section

## Section: CR Verification
**Screen: Verification Queue**
- Table: Name, Email, Level requested, Signup date
- Row actions: **Approve** button (activates account + generates join code for that level), **Reject** button (with optional reason field)
- Tap a row → basic CR Detail view (no proof/document review, per your confirmed flow — just name/email/level)

**Screen: Active CRs**
- Table grouped by level: Name, Role (Main/Assistant), Status
- Row actions: **Deactivate**, **Reassign as Main CR**
- Tap a row → CR profile (their post activity history)

## Section: Levels & Courses
**Screen: Levels Overview**
- Card per level (100L–500L): active student count, active CR(s) listed, join code status (active/regenerated recently)
- Button per card: **Regenerate join code** (confirmation modal — clarifies old code will stop working for anyone who hasn't joined yet)
- Tap a card → **Level Detail**

**Screen: Level Detail**
- Tabs within this screen: Courses | Students
- Courses sub-view: table of courses (code, title, credit unit) for current semester; buttons **+ Add Course**, Edit, Delete
- Students sub-view: roster table (name, email, join date)

## Section: Resources
**Screen: Resources Manager**
- Tree/accordion: Level → Semester → Course → file list
- Button: **+ Upload file** (select level/semester/course, then file picker)
- Delete button per file
- Search/filter by course code

## Section: Session Control
**Screen: Semester & Promotion**
- Display: current semester (1st/2nd), current session year
- Button: **Toggle Semester** → confirmation modal ("This changes what all students/CRs see app-wide. Continue?") → flips `academic_session_state`
- Button: **Promote Session** → confirmation modal showing exact counts ("143 students will move: 100L→200L (32), 200L→300L (29)...") → on confirm, archives current `level_memberships`, creates new ones at next level, logs a `promotion_events` entry
- Table below: past promotion event log (date, triggered by, from/to session)

## Section: Analytics
**Screen: System Health**
- Join code usage per level (join count over time — spike detection hint for leaked codes)
- Storage usage (S3/Cloudinary consumption, per course/level breakdown)
- Post activity per CR (who's posting, who's gone quiet)
- Engagement metrics: login frequency, itinerary adoption rate, comment volume
- Filters: by level, by date range
- Button: Export data (CSV) — optional, nice-to-have

## Section: Settings
**Screen: Admin Settings**
- Admin profile: name, email, change password
- Button: Logout

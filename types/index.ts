export type Role = 'student' | 'cr';
export type RoleInLevel = 'student' | 'main_cr' | 'assistant_cr';
export type PostType = 'assignment' | 'test' | 'lecture' | 'announcement';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  roleInLevel?: RoleInLevel;
  level: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  creditUnit: number;
}

export interface Post {
  id: string;
  courseId: string;
  courseCode: string;
  author: string;
  title: string;
  content: string;
  postType: PostType;
  difficulty: Difficulty | null;
  dueDate: string | null;
  createdAt: string;
  mine?: boolean;
  pastDue?: boolean;
  /** Optional CR attachment (image/file), served from Cloudinary. */
  fileUrl?: string | null;
  fileType?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  scheduledDate: string | null;
  status: 'pending' | 'done';
  /** Backend mirror row (for AI arrange); null until synced. */
  serverId?: string | null;
}

export interface ResourceFile {
  id: string;
  courseId: string;
  title: string;
  fileType: 'pdf' | 'docx' | 'ppt' | 'zip';
  uploadedAt: string;
  mine?: boolean;
}

export interface SemesterEntry {
  id: string;
  label: string;
  gpa: number;
  courses: { code: string; title: string; creditUnit: number; grade: Grade }[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  postId?: string;
  read: boolean;
  createdAt: string;
}

// ── Test (Study / CBT / Past Questions) ─────────────────────────────
// The three practice modes share one funnel: course → year → topics →
// questions. A mode only changes how step four is presented.
export type TestMode = 'study' | 'cbt' | 'past';

export interface Question {
  id: string;
  courseId: string;
  courseCode: string;
  /** Level the question was asked at, e.g. '300L'. */
  year: string;
  /** Topic title — matches a topic in the question bank (server or offline fallback). */
  topic: string;
  prompt: string;
  /** Always four choices, in the order they should be shown. */
  options: string[];
  answerIndex: number;
  /** One-line "why", shown in Study Mode after the answer is revealed. */
  explanation?: string;
}

/** What the student picked before any questions are loaded. */
export interface TestSelection {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  /** Paper year (e.g. exam year). Empty when the bank is local-only. */
  year: string;
  /** Server paper id when the bank came from the API. */
  paperId: string | null;
  /** Empty when `allTopics` is true. */
  topics: string[];
  allTopics: boolean;
}

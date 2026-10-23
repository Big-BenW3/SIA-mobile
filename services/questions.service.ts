import { api } from "./api";
import { OFFLINE_QUESTIONS } from "@/data/questions";
import type { Question, TestSelection } from "@/types";

// ─── Question bank (API-first, offline fallback) ────────────────────
// Papers + questions come from the backend question bank (admin/seed
// loaded). When offline or unseeded, the bundled local bank answers for
// matching course codes so practice never hard-fails. Results are cached
// per course for the session.

interface PaperDto {
  id: string;
  courseId: string;
  year: string;
  title: string;
}

interface QuestionDto {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string | null;
}

export interface BankPaper {
  id: string;
  year: string;
  title: string;
  count: number;
}

interface Bank {
  papers: BankPaper[];
  questions: (Question & { paperId: string })[];
}

const cache = new Map<string, Bank>();

function localBank(courseId: string, courseCode: string): Bank {
  const qs = OFFLINE_QUESTIONS.filter((q) => q.courseCode === courseCode);
  const years = [...new Set(qs.map((q) => q.year))];
  return {
    papers: years.map((year) => ({
      id: `local-${courseId}-${year}`,
      year,
      title: `${courseCode} ${year} (offline bank)`,
      count: qs.filter((q) => q.year === year).length,
    })),
    questions: qs.map((q) => ({
      ...q,
      courseId,
      paperId: `local-${courseId}-${q.year}`,
    })),
  };
}

export async function loadCourseBank(
  courseId: string,
  courseCode: string,
): Promise<Bank> {
  const hit = cache.get(courseId);
  if (hit) return hit;
  try {
    const papers = await api.get<PaperDto[]>(
      `/api/questions/papers?courseId=${encodeURIComponent(courseId)}`,
    );
    const questions: Bank["questions"] = [];
    const out: BankPaper[] = [];
    for (const p of papers) {
      const qs = await api.get<QuestionDto[]>(
        `/api/questions/papers/${p.id}/questions`,
      );
      out.push({ id: p.id, year: p.year, title: p.title, count: qs.length });
      for (const q of qs) {
        questions.push({
          id: q.id,
          courseId,
          courseCode,
          year: p.year,
          topic: q.topic,
          prompt: q.prompt,
          options: q.options,
          answerIndex: q.answerIndex,
          explanation: q.explanation ?? undefined,
          paperId: p.id,
        });
      }
    }
    const bank = { papers: out, questions };
    cache.set(courseId, bank);
    return bank;
  } catch {
    const bank = localBank(courseId, courseCode);
    cache.set(courseId, bank);
    return bank;
  }
}

export function clearBankCache(): void {
  cache.clear();
}

/** Questions for a finished funnel selection (paper-scoped when known). */
export async function fetchQuestions(sel: TestSelection): Promise<Question[]> {
  const bank = await loadCourseBank(sel.courseId, sel.courseCode);
  return bank.questions.filter(
    (q) =>
      (sel.paperId ? q.paperId === sel.paperId : q.year === sel.year) &&
      (sel.allTopics || sel.topics.includes(q.topic)),
  );
}

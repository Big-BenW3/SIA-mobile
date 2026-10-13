import { useEffect, useState } from 'react';
import { fetchQuestions } from '@/services/questions.service';
import type { Question, TestSelection } from '@/types';

// ─── useBankQuestions ───────────────────────────────────────────────
// Loads the finished funnel selection into questions with loading +
// error states. Shared by Study, CBT and Past modes so all three show
// the same shells for the same states.
//
// The reset is *derived*, not assigned: every fetch stamps its result with
// the key it was requested for, and a stale key simply reads as loading.
// That keeps the effect free of synchronous setState.

export function useBankQuestions(selection: TestSelection | null) {
  const [nonce, setNonce] = useState(0);

  const key = selection
    ? `${selection.courseId}|${selection.paperId ?? selection.year}|${selection.topics.join(',')}|${selection.allTopics}|${nonce}`
    : null;

  const [result, setResult] = useState<{
    key: string | null;
    questions: Question[] | null;
    error: string;
  }>({ key: null, questions: null, error: '' });

  useEffect(() => {
    if (!selection || !key) return;
    let live = true;
    fetchQuestions(selection).then(
      (qs) => {
        if (live) setResult({ key, questions: qs, error: '' });
      },
      () => {
        if (live) {
          setResult({
            key,
            questions: null,
            error: 'Could not load questions. Check your connection and retry.',
          });
        }
      },
    );
    return () => {
      live = false;
    };
    // `key` already encodes every field of `selection` that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result.key !== key;

  return {
    questions: loading ? null : result.questions,
    error: loading ? '' : result.error,
    retry: () => setNonce((n) => n + 1),
  };
}

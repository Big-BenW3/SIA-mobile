import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { ChoiceRow, type ChoiceState } from "@/components/test/QuestionParts";
import { TestEmpty } from "@/components/test/TestEmpty";
import { TestSetup } from "@/components/test/TestSetup";
import { useBankQuestions } from "@/components/test/useBankQuestions";
import { ErrorState, LoadingState } from "@/components/shared/States";
import type { Question, TestSelection } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── CBT Mode ───────────────────────────────────────────────────────────────
// The exam-hall simulation: a clock, one pass, no feedback until you submit.
// Answers are locked in, reviewed at the end with a score, and the time allowed
// is derived from the number of questions so a short quiz stays short.

/** Seconds allowed per question — 45s mirrors a real 1-mark CBT item. */
const SECONDS_PER_QUESTION = 45;

function mmss(total: number): string {
  const m = Math.floor(Math.max(0, total) / 60);
  const s = Math.max(0, total) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CbtMode() {
  const router = useRouter();

  const [selection, setSelection] = useState<TestSelection | null>(null);

  // ── Step 1–3: course → paper → topics ──
  if (!selection) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="CBT Mode" showBack onBack={() => router.back()} />
        <TestSetup mode="cbt" onReady={setSelection} />
      </SafeAreaView>
    );
  }

  return (
    <CbtLoader
      selection={selection}
      onExit={() => router.back()}
      onReset={() => setSelection(null)}
    />
  );
}

function CbtLoader({
  selection,
  onExit,
  onReset,
}: {
  selection: TestSelection;
  onExit: () => void;
  onReset: () => void;
}) {
  const { questions, error, retry } = useBankQuestions(selection);

  if (!questions) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="CBT Mode" showBack onBack={onReset} />
        <LoadingState variant="question" message="Loading your paper…" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="CBT Mode" showBack onBack={onReset} />
        <ErrorState message={error} actionLabel="Retry" onAction={retry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <CbtPaper
        questions={questions}
        selection={selection}
        onExit={onExit}
        onReset={onReset}
      />
    </SafeAreaView>
  );
}

/**
 * The paper itself. Split out so the timer's `useEffect` only ever mounts once
 * the funnel is finished — no clocks running behind the setup steps.
 */
function CbtPaper({
  questions,
  selection,
  onExit,
  onReset,
}: {
  questions: Question[];
  selection: TestSelection;
  onExit: () => void;
  onReset: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    questions.length * SECONDS_PER_QUESTION,
  );

  // Kept in a ref so the tick can submit without reading stale state.
  const submittedRef = useRef(false);

  useEffect(() => {
    if (questions.length === 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!submittedRef.current) {
            submittedRef.current = true;
            setSubmitted(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [questions.length]);

  if (questions.length === 0) {
    return (
      <>
        <AppHeader title="CBT Mode" showBack onBack={onReset} />
        <TestEmpty selection={selection} onChangeFilters={onReset} />
      </>
    );
  }

  const score = questions.reduce(
    (n, q) => n + (answers[q.id] === q.answerIndex ? 1 : 0),
    0,
  );
  const answeredCount = Object.keys(answers).length;
  const timedOut = secondsLeft === 0;

  // ── Review: score first, then every question with what you picked ──
  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <>
        <AppHeader title="CBT result" showBack onBack={onExit} />
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{pct}%</Text>
            <Text style={styles.scoreSub}>
              {score} of {questions.length} correct · {selection.courseCode} ·{" "}
              {selection.year}
            </Text>
            {timedOut && (
              <Text style={styles.scoreNote}>
                Time ran out — the paper submitted itself.
              </Text>
            )}
          </View>

          {questions.map((q, i) => {
            const picked = answers[q.id];
            const right = picked === q.answerIndex;
            return (
              <View key={q.id} style={styles.reviewCard}>
                <Text style={styles.reviewTopic}>
                  {i + 1}. {q.topic}
                </Text>
                <Text style={styles.reviewPrompt}>{q.prompt}</Text>
                <Text style={styles.reviewLine}>
                  Your answer:{" "}
                  <Text style={right ? styles.ok : styles.bad}>
                    {picked === undefined ? "not answered" : q.options[picked]}
                  </Text>
                </Text>
                {!right && (
                  <Text style={styles.reviewLine}>
                    Correct:{" "}
                    <Text style={styles.ok}>{q.options[q.answerIndex]}</Text>
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="New set"
            variant="secondary"
            onPress={onReset}
            style={{ flex: 1 }}
          />
          <Button title="Done" onPress={onExit} style={{ flex: 1 }} />
        </View>
      </>
    );
  }

  const question = questions[index];
  const picked = answers[question.id];

  // Leaving mid-paper discards answers — confirm so a stray tap can't nuke it.
  const confirmExit = () =>
    Alert.alert(
      "Leave this paper?",
      "Your answers for this attempt will be lost.",
      [
        { text: "Stay" },
        { text: "Leave", style: "destructive", onPress: onReset },
      ],
    );

  return (
    <>
      <AppHeader title="CBT Mode" showBack onBack={confirmExit} />

      <View style={styles.timerBar}>
        <Text style={styles.timerText}>{mmss(secondsLeft)}</Text>
        <Text style={styles.timerSub}>
          {answeredCount} of {questions.length} answered
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.progress}>
          Question {index + 1} of {questions.length} · {question.topic}
        </Text>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.options.map((opt, i) => (
          <ChoiceRow
            key={opt}
            index={i}
            text={opt}
            state={(picked === i ? "selected" : "idle") as ChoiceState}
            onPress={() =>
              setAnswers((prev) => ({ ...prev, [question.id]: i }))
            }
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Previous"
          variant="secondary"
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          style={{ flex: 1 }}
        />
        {index < questions.length - 1 ? (
          <Button
            title="Next"
            onPress={() => setIndex((i) => i + 1)}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title="Submit"
            onPress={() => {
              submittedRef.current = true;
              setSubmitted(true);
            }}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },

    timerBar: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
    },
    timerText: {
      ...theme.type.title,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    timerSub: { ...theme.type.caption, color: theme.colors.secondary },

    progress: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.xs,
    },
    prompt: {
      ...theme.type.title,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },

    scoreCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    scoreValue: {
      ...theme.type.hero,
      fontSize: 52,
      lineHeight: 58,
      color: theme.colors.onPrimary,
      fontVariant: ["tabular-nums"],
    },
    scoreSub: {
      ...theme.type.caption,
      color: theme.colors.primaryMuted,
      marginTop: 4,
    },
    scoreNote: {
      ...theme.type.caption,
      color: theme.colors.primaryMuted,
      marginTop: 6,
    },

    reviewCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    reviewTopic: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
      marginBottom: 4,
    },
    reviewPrompt: {
      ...theme.type.body,
      color: theme.colors.text,
      marginBottom: 6,
    },
    reviewLine: { ...theme.type.caption, color: theme.colors.secondary },
    ok: {
      color: theme.colors.success,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    bad: {
      color: theme.colors.danger,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },

    footer: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  }),
);

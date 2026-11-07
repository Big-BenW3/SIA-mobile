import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { ClockIcon, CloseIcon, TickIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { Mascot, type MascotPose } from "@/components/mascot/Mascot";
import { ChoiceRow, type ChoiceState } from "@/components/test/QuestionParts";
import { TestEmpty } from "@/components/test/TestEmpty";
import { TestSetup } from "@/components/test/TestSetup";
import { useBankQuestions } from "@/components/test/useBankQuestions";
import { confirmAction } from "@/utils/confirm";
import type { Question, TestSelection } from "@/types";

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

function poseFor(pct: number): MascotPose {
  if (pct >= 70) return "celebrate";
  if (pct >= 40) return "think";
  return "error";
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

  // Error first: on failure `questions` is null too, so checking it first would
  // show the loading skeleton forever.
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="CBT Mode" showBack onBack={onReset} />
        <ErrorState message={error} actionLabel="Retry" onAction={retry} />
      </SafeAreaView>
    );
  }

  if (!questions) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="CBT Mode" showBack onBack={onReset} />
        <LoadingState variant="question" message="Loading your paper…" />
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
  const reduce = useReducedMotion();
  const total = questions.length * SECONDS_PER_QUESTION;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(total);
  // The deadline is a wall-clock time, so a backgrounded app or a late tick
  // can never stretch the exam.
  const [endsAt] = useState(() => Date.now() + total * 1000);

  useEffect(() => {
    if (submitted || questions.length === 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        setSubmitted(true);
      }
    }, 500);
    return () => clearInterval(id);
  }, [submitted, endsAt, questions.length]);

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
          <Animated.View
            entering={reduce ? undefined : FadeIn.duration(duration.enter)}
            style={styles.scoreCard}
            accessible
            accessibilityLabel={`Score ${pct} percent, ${score} of ${questions.length} correct`}
          >
            <Mascot pose={poseFor(pct)} size={96} />
            <Text style={styles.scoreValue}>{pct}%</Text>
            <View style={styles.scoreBar}>
              <ProgressBar value={pct} tone="gold" label="Score" />
            </View>
            <Text style={styles.scoreSub}>
              {score} of {questions.length} correct · {selection.courseCode} ·{" "}
              {selection.year}
            </Text>
            {timedOut && (
              <Text style={styles.scoreNote}>
                Time ran out, so the paper submitted itself.
              </Text>
            )}
          </Animated.View>

          {questions.map((q, i) => {
            const picked = answers[q.id];
            const right = picked === q.answerIndex;
            return (
              <View key={q.id} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewTopic}>
                    {i + 1}. {q.topic}
                  </Text>
                  {right ? (
                    <TickIcon size={20} color={theme.colors.success} />
                  ) : (
                    <CloseIcon size={20} color={theme.colors.danger} />
                  )}
                </View>
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
            style={styles.flex}
          />
          <Button title="Done" onPress={onExit} style={styles.flex} />
        </View>
      </>
    );
  }

  const question = questions[index];
  const picked = answers[question.id];
  const critical = secondsLeft <= 10;
  const low = secondsLeft <= Math.min(60, total * 0.25);
  const timerColor = critical
    ? theme.colors.danger
    : low
      ? theme.colors.warning
      : theme.colors.text;

  // Leaving mid-paper discards answers — confirm so a stray tap can't nuke it.
  const confirmExit = async () => {
    const ok = await confirmAction({
      title: "Leave this paper?",
      message: "Your answers for this attempt will be lost.",
      confirmLabel: "Leave",
      destructive: true,
    });
    if (ok) onReset();
  };

  const submit = async () => {
    const left = questions.length - answeredCount;
    if (left > 0) {
      const ok = await confirmAction({
        title: "Submit now?",
        message: `${left} question${left === 1 ? " is" : "s are"} unanswered and will count as wrong.`,
        confirmLabel: "Submit",
      });
      if (!ok) return;
    }
    setSubmitted(true);
  };

  return (
    <>
      <AppHeader
        title="CBT Mode"
        showBack
        onBack={() => {
          void confirmExit();
        }}
      />

      <View style={styles.timerBar}>
        <View
          style={styles.timerRow}
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`${mmss(secondsLeft)} remaining`}
        >
          <ClockIcon size={22} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {mmss(secondsLeft)}
          </Text>
        </View>
        <Text style={styles.timerSub}>
          {answeredCount} of {questions.length} answered
        </Text>
      </View>
      <View style={styles.timerTrack}>
        <ProgressBar
          value={(secondsLeft / total) * 100}
          tone="ink"
          label="Time remaining"
        />
      </View>

      {/* Jump to any question; ink = answered, ringed = the one you're on. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nav}
        style={styles.navScroll}
      >
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          const current = i === index;
          return (
            <PressableScale
              key={q.id}
              onPress={() => setIndex(i)}
              haptic="selection"
              style={[
                styles.navDot,
                answered && styles.navDotAnswered,
                current && styles.navDotCurrent,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Question ${i + 1}${answered ? ", answered" : ""}${current ? ", current" : ""}`}
            >
              <Text
                style={[styles.navText, answered && styles.navTextAnswered]}
              >
                {i + 1}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

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
            key={`${question.id}-${i}`}
            index={i}
            text={opt}
            state={(picked === i ? "selected" : "idle") as ChoiceState}
            haptic="selection"
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
          style={styles.flex}
        />
        {index < questions.length - 1 ? (
          <Button
            title="Next"
            onPress={() => setIndex((i) => i + 1)}
            style={styles.flex}
          />
        ) : (
          <Button title="Submit" onPress={submit} style={styles.flex} />
        )}
      </View>
    </>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },

    timerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    timerText: { ...theme.type.mono, ...theme.type.title },
    timerSub: { ...theme.type.caption, color: theme.colors.secondary },
    timerTrack: { paddingHorizontal: theme.spacing.md },

    navScroll: { flexGrow: 0 },
    nav: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    navDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    navDotAnswered: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    navDotCurrent: { borderWidth: 2, borderColor: theme.colors.gold },
    navText: { ...theme.type.mono, fontSize: 13, color: theme.colors.text },
    navTextAnswered: { color: theme.colors.onPrimary },

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
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    scoreValue: {
      ...theme.type.hero,
      fontSize: 52,
      lineHeight: 58,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    scoreBar: { alignSelf: "stretch" },
    scoreSub: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
    },
    scoreNote: {
      ...theme.type.caption,
      color: theme.colors.warning,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },

    reviewCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      gap: 4,
    },
    reviewHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.xs,
    },
    reviewTopic: {
      flex: 1,
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    reviewPrompt: { ...theme.type.body, color: theme.colors.text },
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

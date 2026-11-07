import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { TickIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { TestEmpty } from "@/components/test/TestEmpty";
import { TestSetup } from "@/components/test/TestSetup";
import { useBankQuestions } from "@/components/test/useBankQuestions";
import type { Question, TestSelection } from "@/types";

// ─── Past Questions ─────────────────────────────────────────────────────────
// The revision reader: every matching question listed in full, answer already
// shown. No score — this is the format people actually cram from the night
// before. Grouped by topic so a run of questions reads as one subject. A card
// can be collapsed to quiz yourself first.

export default function PastQuestions() {
  const router = useRouter();

  const [selection, setSelection] = useState<TestSelection | null>(null);

  // ── Step 1–3: course → paper → topics ──
  if (!selection) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader
          title="Past Questions"
          showBack
          onBack={() => router.back()}
        />
        <TestSetup mode="past" onReady={setSelection} />
      </SafeAreaView>
    );
  }

  return (
    <PastReader
      selection={selection}
      onReset={() => setSelection(null)}
      onExit={() => router.back()}
    />
  );
}

function PastReader({
  selection,
  onReset,
  onExit,
}: {
  selection: TestSelection;
  onReset: () => void;
  onExit: () => void;
}) {
  const { questions, error, retry } = useBankQuestions(selection);

  // Error first: on failure `questions` is null too, so checking it first would
  // show the loading skeleton forever.
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Past Questions" showBack onBack={onReset} />
        <ErrorState message={error} actionLabel="Retry" onAction={retry} />
      </SafeAreaView>
    );
  }

  if (!questions) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Past Questions" showBack onBack={onReset} />
        <LoadingState variant="question" message="Loading questions…" />
      </SafeAreaView>
    );
  }

  // ── Nothing to show: honestly, kindly, with a way back ──
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Past Questions" showBack onBack={onReset} />
        <TestEmpty selection={selection} onChangeFilters={onReset} />
      </SafeAreaView>
    );
  }

  // Preserve bank order but group the rendering by topic.
  const topics: string[] = [];
  questions.forEach((q) => {
    if (!topics.includes(q.topic)) topics.push(q.topic);
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Past Questions" showBack onBack={onExit} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.summary}>
          {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
          {selection.courseCode} · {selection.year}
        </Text>

        {topics.map((topic) => (
          <View key={topic}>
            <Text style={styles.topic} accessibilityRole="header">
              {topic}
            </Text>
            {questions
              .filter((q) => q.topic === topic)
              .map((q, i) => (
                <PastCard key={q.id} question={q} number={i + 1} />
              ))}
          </View>
        ))}

        <Text style={styles.footNote}>
          Answers come from the uploaded past papers for {selection.courseCode}.
          Spotted a wrong one? Tell your CR.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** One question, answer already visible, with the wrong options de-emphasised. */
function PastCard({
  question,
  number,
}: {
  question: Question;
  number: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <PressableScale
      onPress={() => setOpen((v) => !v)}
      haptic="selection"
      scaleTo={0.99}
      style={styles.card}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`Question ${number}: ${question.prompt}. ${open ? "Hide" : "Show"} answer.`}
    >
      <Text style={styles.qMeta}>Question {number}</Text>
      <Text style={styles.qPrompt}>{question.prompt}</Text>

      {open && (
        <>
          {question.options.map((opt, i) => {
            const correct = i === question.answerIndex;
            return (
              <View key={`${i}-${opt}`} style={styles.optRow}>
                <View style={styles.optMark}>
                  {correct ? (
                    <TickIcon size={16} color={theme.colors.success} />
                  ) : (
                    <View style={styles.optDot} />
                  )}
                </View>
                <Text style={[styles.optText, correct && styles.optTextOn]}>
                  {opt}
                </Text>
              </View>
            );
          })}
          {!!question.explanation && (
            <Text style={styles.why}>{question.explanation}</Text>
          )}
        </>
      )}

      <Text style={styles.toggle}>{open ? "Hide answer" : "Show answer"}</Text>
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },

    summary: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.xs,
      fontVariant: ["tabular-nums"],
    },
    topic: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: theme.colors.accent,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
    },

    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      ...theme.shadow.card,
    },
    qMeta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 4,
    },
    qPrompt: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },

    optRow: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      alignItems: "flex-start",
      marginBottom: 4,
    },
    optMark: {
      width: 18,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    optDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primaryMuted,
    },
    optText: { flex: 1, ...theme.type.caption, color: theme.colors.secondary },
    optTextOn: {
      color: theme.colors.text,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },

    why: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      fontStyle: "italic",
      marginTop: theme.spacing.xs,
    },
    toggle: {
      ...theme.type.caption,
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      marginTop: theme.spacing.sm,
    },
    footNote: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: theme.spacing.lg,
    },
  }),
);

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import {
  ChoiceRow,
  QuestionMeta,
  type ChoiceState,
} from "@/components/test/QuestionParts";
import { TestEmpty } from "@/components/test/TestEmpty";
import { TestSetup } from "@/components/test/TestSetup";
import { useBankQuestions } from "@/components/test/useBankQuestions";
import { ErrorState, LoadingState } from "@/components/shared/States";
import type { TestSelection } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Study Mode ─────────────────────────────────────────────────────────────
// One question at a time, no timer, no score. Answer, learn why, move on —
// the point is understanding, not measurement. CBT Mode is where the clock
// lives. Questions are pulled through the shared funnel first.

export default function StudyMode() {
  const router = useRouter();

  const [selection, setSelection] = useState<TestSelection | null>(null);

  // ── Step 1–3: course → paper → topics ──
  if (!selection) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={() => router.back()} />
        <TestSetup mode="study" onReady={setSelection} />
      </SafeAreaView>
    );
  }

  return (
    <StudyPaper
      selection={selection}
      onReset={() => setSelection(null)}
      onExit={() => router.back()}
    />
  );
}

function StudyPaper({
  selection,
  onReset,
  onExit,
}: {
  selection: TestSelection;
  onReset: () => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const { questions, error, retry } = useBankQuestions(selection);

  if (!questions) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onReset} />
        <LoadingState variant="question" message="Loading questions…" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onReset} />
        <ErrorState message={error} actionLabel="Retry" onAction={retry} />
      </SafeAreaView>
    );
  }

  // ── Nothing to show. A clean, honest dead end with a way back. ──
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onReset} />
        <TestEmpty selection={selection} onChangeFilters={onReset} />
      </SafeAreaView>
    );
  }

  const question = questions[Math.min(index, questions.length - 1)];
  const revealed = picked !== null;
  const isLast = index === questions.length - 1;

  const stateFor = (i: number): ChoiceState => {
    if (!revealed) return "idle";
    if (i === question.answerIndex) return "correct";
    if (i === picked) return "wrong";
    return "idle";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Study Mode" showBack onBack={onExit} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <QuestionMeta
          left={`${question.courseCode} · ${question.year} · ${question.topic}`}
          right={`${index + 1} of ${questions.length}`}
        />
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.options.map((opt, i) => (
          <ChoiceRow
            key={opt}
            index={i}
            text={opt}
            state={stateFor(i)}
            disabled={revealed}
            onPress={() => setPicked(i)}
          />
        ))}

        {!revealed && (
          <Text style={styles.hint}>
            Tap an answer to check it, then continue below.
          </Text>
        )}

        {revealed && (
          <View style={styles.explain}>
            <Text style={styles.explainTitle}>
              {picked === question.answerIndex ? "Correct" : "Not quite"}
            </Text>
            <Text style={styles.explainBody}>
              {question.explanation ??
                `The answer is ${question.options[question.answerIndex]}.`}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Change filters"
          variant="secondary"
          onPress={onReset}
          style={{ flex: 1 }}
        />
        <Button
          title={isLast ? "Finish" : "Next question"}
          disabled={!revealed}
          onPress={() => {
            if (!revealed) return;
            if (isLast) {
              onExit();
              return;
            }
            setIndex((i) => i + 1);
            setPicked(null);
          }}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },
    prompt: {
      ...theme.type.title,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    hint: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: 4,
    },
    explain: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.softBlue,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.accent,
    },
    explainTitle: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    explainBody: { ...theme.type.body, color: theme.colors.text, marginTop: 4 },
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

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { CloseIcon, TickIcon } from "@/components/shared/Icons";
import { haptic } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { Mascot } from "@/components/mascot/Mascot";
import {
  ChoiceRow,
  QuestionMeta,
  type ChoiceState,
} from "@/components/test/QuestionParts";
import { TestEmpty } from "@/components/test/TestEmpty";
import { TestSetup } from "@/components/test/TestSetup";
import { useBankQuestions } from "@/components/test/useBankQuestions";
import type { TestSelection } from "@/types";

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
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { questions, error, retry } = useBankQuestions(selection);

  // Error first: on failure `questions` is null too, so checking it first would
  // show the loading skeleton forever.
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onReset} />
        <ErrorState message={error} actionLabel="Retry" onAction={retry} />
      </SafeAreaView>
    );
  }

  if (!questions) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onReset} />
        <LoadingState variant="question" message="Loading questions…" />
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

  // ── Finished the set: a small, quiet win ──
  if (finished) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Study Mode" showBack onBack={onExit} />
        <Animated.View
          entering={reduce ? undefined : FadeIn.duration(duration.enter)}
          style={styles.done}
        >
          <Mascot pose="celebrate" size={140} label="Stax celebrating" />
          <Text style={styles.doneTitle}>Set complete</Text>
          <Text style={styles.doneBody}>
            You went through {questions.length} question
            {questions.length === 1 ? "" : "s"} for {selection.courseCode} ·{" "}
            {selection.year}.
          </Text>
        </Animated.View>
        <View style={styles.footer}>
          <Button
            title="Study more"
            variant="secondary"
            onPress={onReset}
            style={styles.flex}
          />
          <Button title="Done" onPress={onExit} style={styles.flex} />
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[Math.min(index, questions.length - 1)];
  const revealed = picked !== null;
  const isLast = index === questions.length - 1;
  const correct = picked === question.answerIndex;

  const stateFor = (i: number): ChoiceState => {
    if (!revealed) return "idle";
    if (i === question.answerIndex) return "correct";
    if (i === picked) return "wrong";
    return "idle";
  };

  const choose = (i: number) => {
    setPicked(i);
    // The reveal is the commit: one success/error haptic, paired with the
    // coloured, marked rows (never the only feedback).
    haptic(i === question.answerIndex ? "success" : "error");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Study Mode" showBack onBack={onExit} />
      <View style={styles.progress}>
        <ProgressBar
          value={((index + (revealed ? 1 : 0)) / questions.length) * 100}
          tone="ink"
          label="Study progress"
        />
      </View>

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
            key={`${i}-${opt}`}
            index={i}
            text={opt}
            state={stateFor(i)}
            disabled={revealed}
            onPress={() => choose(i)}
          />
        ))}

        {!revealed && (
          <Text style={styles.hint}>
            Tap an answer to check it, then continue below.
          </Text>
        )}

        {revealed && (
          <Animated.View
            entering={
              reduce
                ? FadeIn.duration(duration.small)
                : FadeInDown.duration(duration.enter).easing(ease.out)
            }
            style={[
              styles.explain,
              correct ? styles.explainOk : styles.explainNo,
            ]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.explainHead}>
              {correct ? (
                <TickIcon size={18} color={theme.colors.success} />
              ) : (
                <CloseIcon size={18} color={theme.colors.danger} />
              )}
              <Text
                style={[
                  styles.explainTitle,
                  {
                    color: correct ? theme.colors.success : theme.colors.danger,
                  },
                ]}
              >
                {correct ? "Correct" : "Not quite"}
              </Text>
            </View>
            <Text style={styles.explainBody}>
              {question.explanation ??
                `The answer is ${question.options[question.answerIndex]}.`}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Change filters"
          variant="secondary"
          onPress={onReset}
          style={styles.flex}
        />
        <Button
          title={isLast ? "Finish" : "Next question"}
          disabled={!revealed}
          onPress={() => {
            if (!revealed) return;
            if (isLast) {
              setFinished(true);
              return;
            }
            setIndex((i) => i + 1);
            setPicked(null);
          }}
          style={styles.flex}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    progress: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
    },
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
      marginTop: theme.spacing.xs,
    },
    explain: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderLeftWidth: 3,
      gap: theme.spacing.xs,
    },
    explainOk: {
      backgroundColor: theme.colors.successTint,
      borderLeftColor: theme.colors.success,
    },
    explainNo: {
      backgroundColor: theme.colors.dangerTint,
      borderLeftColor: theme.colors.danger,
    },
    explainHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    explainTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    explainBody: { ...theme.type.body, color: theme.colors.text },
    done: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    doneTitle: {
      ...theme.type.hero,
      color: theme.colors.text,
      textAlign: "center",
    },
    doneBody: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
      maxWidth: 320,
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

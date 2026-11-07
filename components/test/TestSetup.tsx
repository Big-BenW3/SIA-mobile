import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { Button } from "@/components/shared/Button";
import { SelectChip } from "@/components/shared/Chips";
import { TickIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Reveal } from "@/components/shared/Reveal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { loadCourseBank, type BankPaper } from "@/services/questions.service";
import { useSessionStore } from "@/stores/sessionStore";
import type { TestMode, TestSelection } from "@/types";

// ─── The shared funnel ──────────────────────────────────────────────
// Course → paper → topics. Courses come from the session store; papers
// and topics from the question bank (API-first, offline fallback).
// Only step four differs per mode, so it lives in the mode screens.

const STEPS = ["Course", "Paper", "Topics"] as const;

const MODE_NOUN: Record<TestMode, string> = {
  study: "Study Mode",
  cbt: "CBT Mode",
  past: "Past Questions",
};

export function TestSetup({
  mode,
  onReady,
}: {
  mode: TestMode;
  onReady: (selection: TestSelection) => void;
}) {
  const { courses } = useSessionStore();

  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [paperId, setPaperId] = useState<string | null>(null);
  const [papers, setPapers] = useState<BankPaper[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [pickedTopics, setPickedTopics] = useState<string[]>([]);
  const [allTopics, setAllTopics] = useState(true);
  const [bankStatus, setBankStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );

  const course = courses.find((c) => c.id === courseId) ?? null;

  const pickCourse = async (id: string, code: string) => {
    if (bankStatus === "loading") return; // ignore taps while a bank is loading
    setCourseId(id);
    setPaperId(null);
    setTopics([]);
    setPickedTopics([]);
    setAllTopics(true);
    setBankStatus("loading");
    try {
      const bank = await loadCourseBank(id, code);
      const distinct = [...new Set(bank.questions.map((q) => q.topic))];
      setPapers(bank.papers);
      setTopics(distinct);
      setBankStatus("idle");
      setStep(1);
    } catch {
      setBankStatus("error");
    }
  };

  /** One back rule for the header and the footer alike. */
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const toggleTopic = (t: string) =>
    setPickedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const canLoad =
    !!courseId && !!paperId && (allTopics || pickedTopics.length > 0);

  const load = () => {
    if (!course || !paperId || !canLoad) return;
    onReady({
      courseId: course.id,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      year: papers.find((p) => p.id === paperId)?.year ?? "",
      paperId,
      topics: allTopics ? [] : pickedTopics,
      allTopics,
    });
  };

  const paper = papers.find((p) => p.id === paperId) ?? null;

  return (
    <View style={styles.root}>
      {/* ── Progress: a bar plus the step name, in mono so it never jitters ── */}
      <View style={styles.progress}>
        <Text style={styles.progressLabel} accessibilityLiveRegion="polite">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </Text>
        <ProgressBar
          value={((step + 1) / STEPS.length) * 100}
          tone="ink"
          label="Setup progress"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* key={step}: each step re-enters, so moving on reads as moving on. */}
        <Reveal key={step} index={0}>
          {step === 0 && (
            <>
              <Text style={styles.h1}>Which course?</Text>
              <Text style={styles.sub}>
                Pick the course you want to practise for {MODE_NOUN[mode]}.
              </Text>
              {bankStatus === "loading" && (
                <LoadingState variant="cards" message="Loading papers…" />
              )}
              {/* A failed fetch keeps you on this step, so the error lives here. */}
              {bankStatus === "error" && (
                <View style={styles.statusBox}>
                  <ErrorState
                    message="Could not load papers. Check your connection."
                    actionLabel="Retry"
                    onAction={() =>
                      course && pickCourse(course.id, course.courseCode)
                    }
                  />
                </View>
              )}
              {courses.length === 0 && (
                <View style={styles.statusBox}>
                  <EmptyState
                    pose="read"
                    title="No courses yet"
                    body="Courses for your level appear here once they are added."
                  />
                </View>
              )}
              {bankStatus !== "loading" &&
                courses.map((c) => (
                  <Option
                    key={c.id}
                    title={c.courseCode}
                    sub={c.courseTitle}
                    selected={courseId === c.id}
                    onPress={() => pickCourse(c.id, c.courseCode)}
                  />
                ))}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.h1}>Which paper?</Text>
              <Text style={styles.sub}>
                {course
                  ? `${course.courseCode}. Papers uploaded for this course.`
                  : "Pick a paper."}
              </Text>
              {papers.length === 0 && (
                <View style={styles.statusBox}>
                  <EmptyState
                    pose="sleep"
                    title="No papers yet"
                    body="No question papers have been uploaded for this course. Check back soon."
                  />
                </View>
              )}
              {papers.map((p) => (
                <Option
                  key={p.id}
                  title={p.year}
                  sub={p.title}
                  meta={
                    p.count > 0
                      ? `${p.count} question${p.count === 1 ? "" : "s"}`
                      : "Empty"
                  }
                  selected={paperId === p.id}
                  onPress={() => {
                    setPaperId(p.id);
                    setStep(2);
                  }}
                />
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.h1}>Which topics?</Text>
              <Text style={styles.sub}>
                {course && paper
                  ? `${course.courseCode} · ${paper.year}. `
                  : ""}
                Take the whole paper, or narrow it down.
              </Text>

              <Option
                title="All topics"
                sub="Every question in this paper."
                selected={allTopics}
                onPress={() => setAllTopics(true)}
              />
              <Option
                title="Choose topics"
                sub="Pick one or more. Good for revision sprints."
                selected={!allTopics}
                onPress={() => setAllTopics(false)}
              />

              {!allTopics && topics.length > 0 && (
                <View style={styles.chips}>
                  {topics.map((t) => (
                    <SelectChip
                      key={t}
                      label={t}
                      selected={pickedTopics.includes(t)}
                      onPress={() => toggleTopic(t)}
                    />
                  ))}
                </View>
              )}

              {!allTopics && topics.length === 0 && (
                <Text style={styles.note}>
                  We have no topics mapped for this paper yet.
                </Text>
              )}

              {!allTopics && topics.length > 0 && pickedTopics.length === 0 && (
                <Text style={styles.note}>
                  Select at least one topic to load questions.
                </Text>
              )}
            </>
          )}
        </Reveal>
      </ScrollView>

      {/* ── Footer: step back, or commit and load ── */}
      {(step > 0 || step === 2) && (
        <View style={styles.footer}>
          {step > 0 && (
            <Button
              title="Back"
              variant="secondary"
              onPress={goBack}
              style={styles.flex}
            />
          )}
          {step === 2 && (
            <Button
              title="Load questions"
              disabled={!canLoad}
              onPress={load}
              style={styles.flex}
            />
          )}
        </View>
      )}
    </View>
  );
}

/** A tappable choice row: ink-bordered with a tick when selected. */
function Option({
  title,
  sub,
  meta,
  selected,
  onPress,
}: {
  title: string;
  sub: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${sub}${meta ? `. ${meta}` : ""}`}
      style={[styles.option, selected && styles.optionOn]}
    >
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      {!!meta && <Text style={styles.optionMeta}>{meta}</Text>}
      {selected && (
        <View style={styles.check}>
          <TickIcon size={16} color={theme.colors.onPrimary} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    progress: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    },
    progressLabel: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      fontVariant: ["tabular-nums"],
    },

    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },
    h1: { ...theme.type.title, color: theme.colors.text },
    sub: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: 4,
      marginBottom: theme.spacing.md,
    },
    note: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: theme.spacing.sm,
    },
    statusBox: { minHeight: 240 },

    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      minHeight: 64,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    optionOn: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.softBlue,
    },
    optionBody: { flex: 1, gap: 2 },
    optionTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    optionSub: { ...theme.type.caption, color: theme.colors.secondary },
    optionMeta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      fontVariant: ["tabular-nums"],
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
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

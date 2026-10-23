import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { Button } from "@/components/shared/Button";
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
      {/* ── Progress: three quiet dots, never a step counter ── */}
      <View style={styles.progress}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <View key={label} style={styles.progressItem}>
              <View
                style={[
                  styles.pip,
                  (done || active) && styles.pipOn,
                  active && styles.pipActive,
                ]}
              />
              <Text
                style={[
                  styles.progressLabel,
                  (done || active) && styles.progressLabelOn,
                ]}
              >
                {label}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.rail, done && styles.railOn]} />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <Text style={styles.h1}>Which course?</Text>
            <Text style={styles.sub}>
              Pick the course you want to practise for {MODE_NOUN[mode]}.
            </Text>
            {courses.length === 0 && (
              <EmptyState
                title="No courses yet"
                body="Courses for your level appear here once they are added."
              />
            )}
            {courses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => pickCourse(c.id, c.courseCode)}
                style={[styles.option, courseId === c.id && styles.optionOn]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{c.courseCode}</Text>
                  <Text style={styles.optionSub}>{c.courseTitle}</Text>
                </View>
              </Pressable>
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
            {bankStatus === "loading" && (
              <LoadingState variant="cards" message="Loading papers…" />
            )}
            {bankStatus === "error" && (
              <ErrorState
                message="Could not load papers. Check your connection."
                actionLabel="Retry"
                onAction={() =>
                  course && pickCourse(course.id, course.courseCode)
                }
              />
            )}
            {bankStatus === "idle" && papers.length === 0 && (
              <EmptyState
                title="No papers yet"
                body="No question papers have been uploaded for this course. Check back soon."
              />
            )}
            {bankStatus === "idle" &&
              papers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setPaperId(p.id);
                    setStep(2);
                  }}
                  style={[styles.option, paperId === p.id && styles.optionOn]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{p.year}</Text>
                    <Text style={styles.optionSub}>{p.title}</Text>
                  </View>
                  <Text style={styles.optionMeta}>
                    {p.count > 0
                      ? `${p.count} question${p.count === 1 ? "" : "s"}`
                      : "Empty"}
                  </Text>
                </Pressable>
              ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.h1}>Which topics?</Text>
            <Text style={styles.sub}>
              {course && paper ? `${course.courseCode} · ${paper.year}` : ""} —
              take the whole paper, or narrow it down.
            </Text>

            <Pressable
              onPress={() => setAllTopics(true)}
              style={[styles.option, allTopics && styles.optionOn]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>All topics</Text>
                <Text style={styles.optionSub}>
                  Every question in this paper.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setAllTopics(false)}
              style={[styles.option, !allTopics && styles.optionOn]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Choose topics</Text>
                <Text style={styles.optionSub}>
                  Pick one or more. Good for revision sprints.
                </Text>
              </View>
            </Pressable>

            {!allTopics && topics.length > 0 && (
              <View style={styles.chips}>
                {topics.map((t) => {
                  const on = pickedTopics.includes(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => toggleTopic(t)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
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
      </ScrollView>

      {/* ── Footer: step back, or commit and load ── */}
      <View style={styles.footer}>
        {step > 0 && (
          <Button
            title="Back"
            variant="secondary"
            onPress={goBack}
            style={{ flex: 1 }}
          />
        )}
        {step === 2 && (
          <Button
            title="Load questions"
            disabled={!canLoad}
            onPress={load}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    progress: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    },
    progressItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    pip: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.muted,
    },
    pipOn: { backgroundColor: theme.colors.primaryMuted },
    pipActive: { backgroundColor: theme.colors.accent },
    progressLabel: { ...theme.type.caption, color: theme.colors.secondary },
    progressLabelOn: {
      color: theme.colors.text,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    rail: {
      width: 20,
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 6,
    },
    railOn: { backgroundColor: theme.colors.primaryMuted },

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

    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 64,
      padding: theme.spacing.sm,
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
    optionTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    optionSub: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: 2,
    },
    optionMeta: { ...theme.type.caption, color: theme.colors.secondary },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    chip: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipOn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: { ...theme.type.caption, color: theme.colors.text },
    chipTextOn: {
      color: theme.colors.onPrimary,
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

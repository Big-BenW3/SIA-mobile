import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ErrorState } from "@/components/shared/States";
import { GRADE_POINTS, useCgpaStore } from "@/stores/cgpaStore";
import { confirmAction } from "@/utils/confirm";
import { themedStyles } from "@/components/themedStyles";

// ─── SemesterDetail (shared, both roles) ────────────────────────────
// Unknown ids render a real 404, never another semester's data. Deletion is
// local (on-device SQLite) and instant, behind a confirm that also works on
// web (Alert.alert does not).

export function SemesterDetail() {
  const { semesterId } = useLocalSearchParams<{ semesterId: string }>();
  const router = useRouter();
  const { semesters, deleteSemester } = useCgpaStore();
  const sem = semesters.find((s) => s.id === semesterId);

  if (!sem) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Semester" showBack />
        <ErrorState
          title="Semester not found"
          message="That semester entry does not exist. It may have been deleted."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const units = sem.courses.reduce((u, c) => u + c.creditUnit, 0);

  const remove = async () => {
    const ok = await confirmAction({
      title: "Delete entry?",
      message: "This removes the semester from your CGPA.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    deleteSemester(sem.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={sem.label} showBack />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0}>
          <View
            style={styles.hero}
            accessible
            accessibilityLabel={`Semester GPA ${sem.gpa.toFixed(2)} out of 5`}
          >
            <Text style={styles.gpa}>{sem.gpa.toFixed(2)}</Text>
            <View style={styles.bar}>
              <ProgressBar
                value={(sem.gpa / 5) * 100}
                tone="gold"
                label="Semester GPA out of 5"
              />
            </View>
            <Text style={styles.meta}>
              Semester GPA · {sem.courses.length} course
              {sem.courses.length === 1 ? "" : "s"} · {units} units
            </Text>
          </View>
        </Reveal>

        <Reveal index={1}>
          <SectionHeader title="Courses" />
          {sem.courses.map((c, i) => (
            // Course codes can repeat within a semester, so the code alone is
            // not a safe key.
            <View key={`${c.code}-${i}`} style={styles.course}>
              <View style={styles.courseBody}>
                <Text style={styles.code}>{c.code}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {c.title}
                </Text>
                <Text style={styles.pts}>
                  {c.creditUnit} unit{c.creditUnit === 1 ? "" : "s"} ·{" "}
                  {GRADE_POINTS[c.grade]} point
                  {GRADE_POINTS[c.grade] === 1 ? "" : "s"}
                </Text>
              </View>
              <View
                style={styles.grade}
                accessible
                accessibilityLabel={`Grade ${c.grade}`}
              >
                <Text style={styles.gradeText}>{c.grade}</Text>
              </View>
            </View>
          ))}
        </Reveal>

        <Reveal index={2} style={styles.actions}>
          <Button title="Delete semester" variant="danger" onPress={remove} />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
    hero: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.xs,
      ...theme.shadow.card,
    },
    gpa: {
      ...theme.type.hero,
      fontSize: 48,
      lineHeight: 54,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    bar: { alignSelf: "stretch" },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
    },
    course: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    courseBody: { flex: 1, gap: 2 },
    code: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    title: { ...theme.type.body, color: theme.colors.text },
    pts: { ...theme.type.caption, color: theme.colors.secondary },
    grade: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    gradeText: { ...theme.type.title, color: theme.colors.text },
    actions: { marginTop: theme.spacing.lg },
  }),
);

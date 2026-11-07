import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { ChevronIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/States";
import { useCgpaStore } from "@/stores/cgpaStore";
import { themedStyles } from "@/components/themedStyles";

// ─── CgpaOverview (shared, both roles) ──────────────────────────────
// CGPA lives behind Profile, not a tab: it is checked occasionally, not
// worked in every session. `base` scopes drill-down navigation; the
// math (credit-weighted) lives in the store, never here.

const SCALE_MAX = 5;

export function CgpaOverview({ base }: { base: "(student)" | "(cr)" }) {
  const router = useRouter();
  const { semesters, cgpa } = useCgpaStore();

  const hasData = semesters.length > 0;
  const raw = hasData ? cgpa() : 0;
  const value = hasData ? raw.toFixed(2) : "—";
  const best = hasData
    ? Math.max(...semesters.map((s) => s.gpa)).toFixed(2)
    : "—";
  const units = semesters.reduce(
    (sum, s) => sum + s.courses.reduce((u, c) => u + c.creditUnit, 0),
    0,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="CGPA" showBack />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* The one focal element: the number you came here for. */}
        <Reveal index={0}>
          <View
            style={styles.hero}
            accessible
            accessibilityLabel={
              hasData
                ? `Current CGPA ${value} out of ${SCALE_MAX}`
                : "No CGPA yet"
            }
          >
            <Text style={styles.heroLabel}>Current CGPA</Text>
            <Text style={styles.heroValue}>{value}</Text>
            <View style={styles.heroBar}>
              <ProgressBar
                value={(raw / SCALE_MAX) * 100}
                tone="onInk"
                label="CGPA out of 5"
              />
            </View>
            <Text style={styles.heroSub}>
              of {SCALE_MAX.toFixed(2)} · {semesters.length} semester
              {semesters.length === 1 ? "" : "s"} tracked
            </Text>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{best}</Text>
              <Text style={styles.statLabel}>Best semester</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{units}</Text>
              <Text style={styles.statLabel}>Credit units</Text>
            </View>
          </View>
        </Reveal>

        <Reveal index={2}>
          <SectionHeader title="Semesters" />
          {semesters.map((s) => (
            <PressableScale
              key={s.id}
              onPress={() => router.push(`${base}/cgpa/${s.id}` as never)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${s.label}, GPA ${s.gpa.toFixed(2)}`}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{s.label}</Text>
                <Text style={styles.rowSub}>
                  {s.courses.length} course{s.courses.length === 1 ? "" : "s"} ·{" "}
                  {s.courses.reduce((u, c) => u + c.creditUnit, 0)} units
                </Text>
              </View>
              <Text style={styles.rowGpa}>{s.gpa.toFixed(2)}</Text>
              <ChevronIcon />
            </PressableScale>
          ))}

          {!hasData && (
            <View style={styles.empty}>
              <EmptyState
                pose="read"
                title="No semesters yet"
                body="Add your first semester and SIA starts tracking your CGPA from there. Grades stay on this phone."
              />
            </View>
          )}
        </Reveal>

        <Reveal index={3} style={styles.actions}>
          <Button
            title="Add semester"
            onPress={() => router.push(`${base}/cgpa/add-semester` as never)}
          />
          <Button
            title="Practice questions"
            variant="secondary"
            onPress={() => router.push(`${base}/test` as never)}
          />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
    hero: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.xs,
      ...theme.shadow.card,
    },
    heroLabel: { ...theme.type.caption, color: theme.colors.onPrimaryMid },
    heroValue: {
      ...theme.type.hero,
      fontSize: 56,
      lineHeight: 62,
      color: theme.colors.onPrimary,
      fontVariant: ["tabular-nums"],
    },
    heroBar: { alignSelf: "stretch" },
    heroSub: { ...theme.type.caption, color: theme.colors.onPrimaryMid },
    statRow: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    stat: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    statValue: {
      ...theme.type.mono,
      ...theme.type.title,
      color: theme.colors.text,
    },
    statLabel: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      minHeight: 64,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      ...theme.shadow.card,
    },
    rowBody: { flex: 1, gap: 2 },
    rowTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    rowSub: { ...theme.type.caption, color: theme.colors.secondary },
    rowGpa: {
      ...theme.type.mono,
      ...theme.type.title,
      color: theme.colors.accent,
    },
    empty: { minHeight: 240 },
    actions: { gap: theme.spacing.xs, marginTop: theme.spacing.lg },
  }),
);

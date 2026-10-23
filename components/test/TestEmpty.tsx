import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { Button } from "@/components/shared/Button";
import type { TestSelection } from "@/types";

// ─── "Nothing here yet" ─────────────────────────────────────────────────────
// An empty bank is a normal outcome, not a failure: the student asked a fair
// question and we simply have no questions for that course and level. So this
// reads as information plus a way forward, never as an error.

export function TestEmpty({
  selection,
  onChangeFilters,
}: {
  selection: TestSelection;
  onChangeFilters: () => void;
}) {
  const scope = selection.allTopics
    ? "the whole course"
    : `${selection.topics.length} topic${selection.topics.length === 1 ? "" : "s"}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>?</Text>
      </View>
      <Text style={styles.title}>No questions for this yet</Text>
      <Text style={styles.body}>
        We don’t have any questions for{" "}
        <Text style={styles.strong}>
          {selection.courseCode} · {selection.year}
        </Text>{" "}
        ({scope}). Nothing is broken. The bank is just sparse above and below
        your level.
      </Text>

      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>What usually works</Text>
        <Text style={styles.hintLine}>
          • Try another level for {selection.courseCode}
        </Text>
        <Text style={styles.hintLine}>
          • Switch to “All topics” if you narrowed it down
        </Text>
        <Text style={styles.hintLine}>
          • Ask your CR to upload past questions for this course
        </Text>
      </View>

      <Button
        title="Change filters"
        variant="secondary"
        onPress={onChangeFilters}
      />
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    mark: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xs,
    },
    markText: {
      ...theme.type.hero,
      color: theme.colors.accent,
      lineHeight: 34,
    },
    title: {
      ...theme.type.title,
      color: theme.colors.text,
      textAlign: "center",
    },
    body: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
    },
    strong: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    hintCard: {
      alignSelf: "stretch",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 6,
      marginVertical: theme.spacing.sm,
    },
    hintTitle: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    hintLine: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

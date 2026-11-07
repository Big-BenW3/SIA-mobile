import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { Button } from "@/components/shared/Button";
import { Mascot } from "@/components/mascot/Mascot";
import type { TestSelection } from "@/types";

// ─── "Nothing here yet" ─────────────────────────────────────────────────────
// An empty bank is a normal outcome, not a failure: the student asked a fair
// question and we simply have no questions for that course and level. So this
// reads as information plus a way forward, never as an error. Stax is
// "thinking" (looking for it), not "error".

export function TestEmpty({
  selection,
  onChangeFilters,
}: {
  selection: TestSelection;
  onChangeFilters: () => void;
}) {
  const reduce = useReducedMotion();
  const scope = selection.allTopics
    ? "the whole course"
    : `${selection.topics.length} topic${selection.topics.length === 1 ? "" : "s"}`;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(duration.enter)}
      style={styles.wrap}
    >
      <Mascot pose="think" size={104} />
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
          • Try another paper for {selection.courseCode}
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
    </Animated.View>
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
    title: {
      ...theme.type.title,
      color: theme.colors.text,
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
    body: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
      maxWidth: 360,
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
      gap: theme.spacing.xs,
      marginVertical: theme.spacing.sm,
    },
    hintTitle: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    hintLine: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

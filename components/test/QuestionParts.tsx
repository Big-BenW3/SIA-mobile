import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";

// Small pieces shared by the question screens. Kept dumb: they render state,
// they never decide it.

export type ChoiceState = "idle" | "selected" | "correct" | "wrong";

const BADGE = ["A", "B", "C", "D"];

/** One answer option. Colour alone never carries meaning — a mark does too. */
export function ChoiceRow({
  index,
  text,
  state,
  onPress,
  disabled,
}: {
  index: number;
  text: string;
  state: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.row,
        state === "selected" && styles.rowSelected,
        state === "correct" && styles.rowCorrect,
        state === "wrong" && styles.rowWrong,
      ]}
    >
      <View
        style={[
          styles.badge,
          state === "selected" && styles.badgeSelected,
          state === "correct" && styles.badgeCorrect,
          state === "wrong" && styles.badgeWrong,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            (state === "selected" ||
              state === "correct" ||
              state === "wrong") &&
              styles.badgeTextOn,
          ]}
        >
          {BADGE[index] ?? index + 1}
        </Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {(state === "correct" || state === "wrong") && (
        <Text
          style={[
            styles.mark,
            state === "correct" ? styles.markOk : styles.markNo,
          ]}
        >
          {state === "correct" ? "✓" : "✕"}
        </Text>
      )}
    </Pressable>
  );
}

/** Topic + question-count strip that sits above a question. */
export function QuestionMeta({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLeft}>{left}</Text>
      <Text style={styles.metaRight}>{right}</Text>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      padding: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    rowSelected: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.softBlue,
    },
    rowCorrect: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.surface,
    },
    rowWrong: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.surface,
    },
    badge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.muted,
    },
    badgeSelected: { backgroundColor: theme.colors.primary },
    badgeCorrect: { backgroundColor: theme.colors.success },
    badgeWrong: { backgroundColor: theme.colors.danger },
    badgeText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    badgeTextOn: { color: theme.colors.onPrimary },
    text: { flex: 1, ...theme.type.body, color: theme.colors.text },
    mark: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    markOk: { color: theme.colors.success },
    markNo: { color: theme.colors.danger },

    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    metaLeft: { ...theme.type.caption, color: theme.colors.secondary },
    metaRight: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      fontVariant: ["tabular-nums"],
    },
  }),
);

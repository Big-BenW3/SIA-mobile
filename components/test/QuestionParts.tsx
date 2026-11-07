import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { CloseIcon, TickIcon } from "@/components/shared/Icons";
import {
  PressableScale,
  type HapticKind,
} from "@/components/shared/PressableScale";

// Small pieces shared by the question screens. Kept dumb: they render state,
// they never decide it.

export type ChoiceState = "idle" | "selected" | "correct" | "wrong";

const BADGE = ["A", "B", "C", "D"];

/**
 * One answer option. Colour alone never carries meaning: right and wrong also
 * get a tick or cross mark, and the label says so for screen readers.
 */
export function ChoiceRow({
  index,
  text,
  state,
  onPress,
  disabled,
  haptic,
}: {
  index: number;
  text: string;
  state: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
  /** Fired on commit. Leave unset when the screen fires its own (study mode). */
  haptic?: HapticKind;
}) {
  const reduce = useReducedMotion();
  const letter = BADGE[index] ?? String(index + 1);
  const status =
    state === "correct"
      ? ", correct answer"
      : state === "wrong"
        ? ", your answer, incorrect"
        : state === "selected"
          ? ", selected"
          : "";

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={disabled ? undefined : haptic}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`Option ${letter}: ${text}${status}`}
      accessibilityState={{ selected: state === "selected", disabled }}
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
          style={[styles.badgeText, state !== "idle" && styles.badgeTextOn]}
        >
          {letter}
        </Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {(state === "correct" || state === "wrong") && (
        <Animated.View
          entering={reduce ? undefined : FadeIn.duration(duration.small)}
        >
          {state === "correct" ? (
            <TickIcon size={22} color={theme.colors.success} />
          ) : (
            <CloseIcon size={22} color={theme.colors.danger} />
          )}
        </Animated.View>
      )}
    </PressableScale>
  );
}

/** Topic + question-count strip that sits above a question. */
export function QuestionMeta({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLeft} numberOfLines={1}>
        {left}
      </Text>
      <Text style={styles.metaRight}>{right}</Text>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
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
      backgroundColor: theme.colors.successTint,
    },
    rowWrong: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerTint,
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

    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    metaLeft: { flex: 1, ...theme.type.caption, color: theme.colors.secondary },
    metaRight: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      fontVariant: ["tabular-nums"],
    },
  }),
);

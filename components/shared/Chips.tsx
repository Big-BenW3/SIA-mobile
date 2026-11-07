import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import type { Difficulty, PostType } from "@/types";
import { themedStyles } from "@/components/themedStyles";
import { PressableScale } from "./PressableScale";

const POST_LABEL: Record<PostType, string> = {
  assignment: "Assignment",
  test: "Test",
  lecture: "Lecture",
  announcement: "Notice",
};

// Outline pill: the post type is metadata, not the focal point. The filled
// softBlue pill below belongs to the course tag, so the two read differently.
export function PostTypeChip({ type }: { type: PostType }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{POST_LABEL[type]}</Text>
    </View>
  );
}

export function DifficultyDot({ level }: { level: Difficulty | null }) {
  if (!level) return null;
  const color =
    level === "easy"
      ? theme.colors.easy
      : level === "medium"
        ? theme.colors.medium
        : theme.colors.hard;
  const label =
    level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard";
  return (
    <View
      style={[
        styles.diff,
        { backgroundColor: `${color}14`, borderColor: `${color}33` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.diffText, { color }]}>{label}</Text>
    </View>
  );
}

export function CourseTag({ code }: { code: string }) {
  return (
    <View style={styles.course}>
      <Text style={styles.courseText}>{code}</Text>
    </View>
  );
}

// ─── SelectChip ────────────────────────────────────────────────────
// One selectable chip for level pickers, feed filters and difficulty. The
// fill cross-fades in 180ms (a state change worth explaining); a selection
// haptic fires on commit. `tone` recolours the selected state (difficulty).
export function SelectChip({
  label,
  selected,
  onPress,
  tone,
  dot,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Selected fill colour; defaults to ink. */
  tone?: string;
  /** Show a leading colour dot (used by difficulty chips). */
  dot?: string;
}) {
  const on = useSharedValue(selected ? 1 : 0);
  const fill = tone ?? theme.colors.primary;

  useEffect(() => {
    on.set(
      withTiming(selected ? 1 : 0, {
        duration: duration.small,
        easing: ease.out,
      }),
    );
  }, [selected, on]);

  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      on.get(),
      [0, 1],
      [theme.colors.surface, fill],
    ),
    borderColor: interpolateColor(
      on.get(),
      [0, 1],
      [theme.colors.border, fill],
    ),
  }));
  const text = useAnimatedStyle(() => ({
    color: interpolateColor(
      on.get(),
      [0, 1],
      [theme.colors.text, theme.colors.onPrimary],
    ),
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={styles.selectHit}
    >
      <Animated.View style={[styles.select, box]}>
        {dot ? (
          <View
            style={[
              styles.dot,
              { backgroundColor: selected ? theme.colors.onPrimary : dot },
            ]}
          />
        ) : null}
        <Animated.Text style={[styles.selectText, text]}>{label}</Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    chip: {
      borderWidth: 1,
      borderColor: theme.colors.text,
      borderRadius: theme.radius.full,
      paddingHorizontal: 12,
      paddingVertical: 3,
    },
    chipText: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    course: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    courseText: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
    },
    diff: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: theme.radius.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    diffText: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    selectHit: { alignSelf: "flex-start" },
    select: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    selectText: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);

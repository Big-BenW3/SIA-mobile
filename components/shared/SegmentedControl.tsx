import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { PressableScale } from "./PressableScale";

// ─── Segmented control ─────────────────────────────────────────────
// `progress` is a continuous 0…n-1 value (a pager's scrollX / width, or a
// timed value for tap-only use). The pill is a transform driven by it, so it
// follows a swipe frame by frame and can be interrupted mid-flight; label
// colours cross-fade from the same value.

const PAD = 4;

export function SegmentedControl({
  labels,
  progress,
  onPress,
}: {
  labels: readonly string[];
  progress: SharedValue<number>;
  onPress: (index: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const segW = width > 0 ? (width - PAD * 2) / labels.length : 0;

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * segW }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segW > 0 && (
        <Animated.View style={[styles.pill, { width: segW }, pill]} />
      )}
      {labels.map((label, i) => (
        <Segment
          key={label}
          label={label}
          i={i}
          progress={progress}
          onPress={() => onPress(i)}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  i,
  progress,
  onPress,
}: {
  label: string;
  i: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const text = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.get(),
      [i - 1, i, i + 1],
      [theme.colors.secondary, theme.colors.text, theme.colors.secondary],
    ),
  }));
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.98}
      style={styles.seg}
      accessibilityRole="tab"
      accessibilityLabel={label}
    >
      <Animated.Text style={[styles.label, text]}>{label}</Animated.Text>
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.full,
      padding: PAD,
    },
    pill: {
      position: "absolute",
      top: PAD,
      bottom: PAD,
      left: PAD,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.full,
      ...theme.shadow.card,
    },
    seg: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);

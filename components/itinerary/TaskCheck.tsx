import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { TickIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { themedStyles } from "@/components/themedStyles";

// Completing a task is the app's small victory, so the box earns a little
// motion: the ring fills ink and the tick settles in from 0.8 scale + opacity
// (never from 0). Press feedback and a light haptic come from PressableScale.
export function TaskCheck({
  done,
  onToggle,
  label,
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
}) {
  const reduce = useReducedMotion();
  const d = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    d.set(
      withTiming(done ? 1 : 0, { duration: duration.small, easing: ease.out }),
    );
  }, [done, d]);

  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      d.get(),
      [0, 1],
      [theme.colors.surface, theme.colors.primary],
    ),
    borderColor: interpolateColor(
      d.get(),
      [0, 1],
      [theme.colors.primaryMuted, theme.colors.primary],
    ),
  }));
  const tick = useAnimatedStyle(() => ({
    opacity: d.get(),
    transform: [{ scale: reduce ? 1 : 0.8 + d.get() * 0.2 }],
  }));

  return (
    <PressableScale
      onPress={onToggle}
      haptic="light"
      hitSlop={8}
      style={styles.hit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.box, box]}>
        <Animated.View style={tick}>
          <TickIcon size={18} color={theme.colors.onPrimary} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    hit: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -theme.spacing.xs,
    },
    box: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
  }),
);

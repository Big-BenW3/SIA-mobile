import { useCallback } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { duration, ease, pressScale } from "@/constants/motion";

// ─── PressableScale ────────────────────────────────────────────────
// The one pressable for the whole app. Feedback lands on press-IN (scale to
// 0.97 in 120ms, ease-out), the action commits on press-OUT, and the optional
// haptic fires on the commit — one per user action, never the only feedback.
// Reduced motion swaps the scale for a small opacity dip.

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type HapticKind = "light" | "medium" | "selection" | "success" | "error";

export function haptic(kind: HapticKind) {
  try {
    if (kind === "selection") void Haptics.selectionAsync();
    else if (kind === "light")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === "medium")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (kind === "success")
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // haptics are a nicety: unsupported hardware/web must never break a press
  }
}

export function PressableScale({
  children,
  onPress,
  style,
  disabled,
  haptic: hapticKind,
  scaleTo = pressScale,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticKind;
  scaleTo?: number;
}) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0); // 0 rest → 1 pressed

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : 1 - p.get() * (1 - scaleTo) }],
    opacity: reduce ? 1 - p.get() * 0.15 : 1,
  }));

  const pressIn = useCallback(() => {
    p.set(withTiming(1, { duration: duration.press, easing: ease.out }));
  }, [p]);
  const pressOut = useCallback(() => {
    p.set(withTiming(0, { duration: duration.release, easing: ease.out }));
  }, [p]);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (hapticKind) haptic(hapticKind);
      onPress?.(e);
    },
    [hapticKind, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress || hapticKind ? handlePress : undefined}
      onPressIn={pressIn}
      onPressOut={pressOut}
      pressRetentionOffset={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

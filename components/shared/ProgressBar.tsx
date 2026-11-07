import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { ease } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";

// Progress track + fill. The fill grows with scaleX from the left edge (a
// transform, so no layout work) and eases to the new value — it is how the
// academic-week bar "arrives" instead of appearing at its final width.
export function ProgressBar({
  value,
  tone = "gold",
  label,
}: {
  /** 0–100 */
  value: number;
  tone?: "gold" | "ink" | "onInk";
  label?: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const s = useSharedValue(reduce ? pct : 0);

  useEffect(() => {
    s.set(reduce ? pct : withTiming(pct, { duration: 600, easing: ease.out }));
  }, [pct, reduce, s]);

  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: s.get() }] }));

  return (
    <View
      style={[styles.track, tone === "onInk" && styles.trackOnInk]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          tone === "gold" && styles.fillGold,
          tone === "ink" && styles.fillInk,
          tone === "onInk" && styles.fillOnInk,
          fill,
        ]}
      />
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.softBlue,
      overflow: "hidden",
    },
    trackOnInk: { backgroundColor: theme.colors.onPrimaryLow },
    fill: { height: 8, borderRadius: 4, transformOrigin: "left center" },
    fillGold: { backgroundColor: theme.colors.gold },
    fillInk: { backgroundColor: theme.colors.primary },
    fillOnInk: { backgroundColor: theme.colors.onPrimary },
  }),
);

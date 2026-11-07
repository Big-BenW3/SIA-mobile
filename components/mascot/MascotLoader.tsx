import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { Mascot, type MascotPose } from "./Mascot";

// ─── Running loader ────────────────────────────────────────────────
// Stax runs in place while the ground scrolls under it — a constant-speed
// (linear) loop, the one place linear easing is correct. Used for the app's
// first load, AI arrangement and uploads: moments that take a while and
// benefit from a face. Short fetches keep their skeletons.

const DASH = 14;
const GAP = 14;
const PERIOD = DASH + GAP;
const COUNT = 14;

export function MascotLoader({
  message,
  size = 72,
  pose = "run",
}: {
  message?: string;
  size?: number;
  pose?: MascotPose;
}) {
  const reduce = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(x);
    x.set(0);
    if (!reduce) {
      x.set(
        withRepeat(
          withTiming(-PERIOD, { duration: 440, easing: Easing.linear }),
          -1,
          false,
        ),
      );
    }
    return () => cancelAnimation(x);
  }, [reduce, x]);

  const track = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? "Loading"}
      accessibilityLiveRegion="polite"
    >
      <Mascot pose={pose} size={size} shadow={false} />
      <View style={[styles.ground, { width: size * 2.2 }]}>
        <Animated.View style={[styles.dashes, track]}>
          {Array.from({ length: COUNT }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </Animated.View>
      </View>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
    },
    ground: {
      height: 4,
      overflow: "hidden",
      marginTop: -6,
    },
    dashes: { flexDirection: "row", width: COUNT * PERIOD },
    dash: {
      width: DASH,
      height: 4,
      marginRight: GAP,
      borderRadius: 2,
      backgroundColor: theme.colors.primaryMuted,
      opacity: 0.55,
    },
    message: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
  }),
);

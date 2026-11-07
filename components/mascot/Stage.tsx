import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";

// The soft panel Stax stands on in welcome/onboarding: concentric rings and a
// gold dot give depth without any illustration assets.

export function Stage({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stage, style]}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringInner]} />
      <View style={styles.gold} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    stage: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.xl,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    ring: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.primaryMuted,
      opacity: 0.35,
    },
    ringOuter: { width: 360, height: 360 },
    ringInner: { width: 240, height: 240 },
    gold: {
      position: "absolute",
      top: 28,
      right: 32,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.gold,
    },
    content: { alignItems: "center", gap: theme.spacing.md },
  }),
);

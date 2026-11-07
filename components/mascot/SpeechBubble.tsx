import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";

// A speech bubble for Stax. The tail is a rotated square sharing the bubble's
// fill and two border edges, so bubble + tail read as one outline.

export function SpeechBubble({
  text,
  tail = "bottom",
}: {
  text: string;
  /** Which edge the tail points from. */
  tail?: "bottom" | "left";
}) {
  return (
    <View style={styles.bubble} accessibilityRole="text">
      <Text style={styles.text}>{text}</Text>
      <View style={tail === "bottom" ? styles.tailBottom : styles.tailLeft} />
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    bubble: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      maxWidth: 280,
    },
    text: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      textAlign: "center",
    },
    tailBottom: {
      position: "absolute",
      bottom: -8,
      left: "50%",
      marginLeft: -7,
      width: 14,
      height: 14,
      backgroundColor: theme.colors.surface,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      transform: [{ rotate: "45deg" }],
    },
    tailLeft: {
      position: "absolute",
      left: -8,
      top: "50%",
      marginTop: -7,
      width: 14,
      height: 14,
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      transform: [{ rotate: "45deg" }],
    },
  }),
);

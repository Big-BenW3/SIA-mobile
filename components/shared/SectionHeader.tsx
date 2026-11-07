import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { PressableScale } from "./PressableScale";

// Section title with an optional trailing action. Same rhythm on every screen:
// 32px above (a new group), 8px below (its content).
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          hitSlop={12}
          style={styles.action}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xs,
    },
    title: { ...theme.type.title, color: theme.colors.text },
    action: { minHeight: 32, justifyContent: "center" },
    actionText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
  }),
);

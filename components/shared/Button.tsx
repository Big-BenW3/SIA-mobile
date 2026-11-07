import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { PressableScale, type HapticKind } from "./PressableScale";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const HAPTIC: Record<Variant, HapticKind | undefined> = {
  primary: "light",
  danger: "medium",
  secondary: undefined,
  ghost: undefined,
};

export function Button({
  title,
  onPress,
  variant = "primary",
  style,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Shows a spinner and blocks presses; keeps the button's size stable. */
  loading?: boolean;
}) {
  const off = disabled || loading;
  const labelColor =
    variant === "primary" || variant === "danger"
      ? theme.colors.onPrimary
      : theme.colors.accent;

  return (
    <PressableScale
      onPress={off ? undefined : onPress}
      disabled={off}
      haptic={off ? undefined : HAPTIC[variant]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: off, busy: loading }}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        variant === "ghost" && styles.ghost,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.labelPrimary,
            variant === "secondary" && styles.labelSecondary,
            variant === "danger" && styles.labelDanger,
            variant === "ghost" && styles.labelGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    base: {
      minHeight: 48, // 44pt+ tap target
      borderRadius: theme.radius.lg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    primary: { backgroundColor: theme.colors.primary },
    secondary: {
      backgroundColor: theme.colors.softBlue,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    danger: { backgroundColor: theme.colors.danger },
    ghost: { backgroundColor: "transparent" },
    disabled: { opacity: 0.4 },
    label: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    labelPrimary: { color: theme.colors.onPrimary },
    labelSecondary: { color: theme.colors.accent },
    labelDanger: { color: theme.colors.onPrimary },
    labelGhost: { color: theme.colors.accent },
  }),
);

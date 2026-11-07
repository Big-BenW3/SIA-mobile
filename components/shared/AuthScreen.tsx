import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { BackIcon } from "./Icons";
import { PressableScale } from "./PressableScale";
import { Mascot, type MascotPose } from "@/components/mascot/Mascot";

// ─── Auth scaffold ─────────────────────────────────────────────────
// Every auth screen (login, both signups, forgot password) shares this: a
// scrolling, keyboard-aware column so no field is ever hidden behind the
// keyboard, a back button, and Stax in the corner reacting to the form
// (idle → thinking while submitting → error when the server says no).

export function AuthScreen({
  title,
  subtitle,
  pose = "idle",
  showBack = true,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  pose?: MascotPose;
  showBack?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.topRow}>
            {showBack ? (
              <PressableScale
                onPress={() => router.back()}
                style={styles.back}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <BackIcon />
              </PressableScale>
            ) : (
              <View style={styles.back} />
            )}
            <Mascot pose={pose} size={64} />
          </View>

          <Animated.View
            entering={
              reduce
                ? undefined
                : FadeInDown.duration(duration.enter).easing(ease.out)
            }
          >
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
            <View style={styles.form}>{children}</View>
            {footer}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Form-level message (server errors, "check your inbox"). Fields keep their own. */
export function FormError({ message }: { message?: string | null }) {
  const reduce = useReducedMotion();
  if (!message) return null;
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(duration.small)}
      style={styles.error}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    content: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 72,
      marginBottom: theme.spacing.sm,
    },
    back: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -theme.spacing.xs,
    },
    title: { ...theme.type.hero, color: theme.colors.text },
    sub: {
      ...theme.type.body,
      color: theme.colors.secondary,
      marginTop: theme.spacing.xs,
    },
    form: { marginTop: theme.spacing.lg, gap: theme.spacing.xs },
    error: {
      backgroundColor: theme.colors.dangerTint,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    errorText: { ...theme.type.body, color: theme.colors.danger },
  }),
);

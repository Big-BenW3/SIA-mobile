import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { Button } from "./Button";
import { TickIcon } from "./Icons";
import { haptic } from "./PressableScale";
import { Mascot, type MascotPose } from "@/components/mascot/Mascot";
import { MascotLoader } from "@/components/mascot/MascotLoader";
import {
  BlockSkeleton,
  CalendarSkeleton,
  CardListSkeleton,
  DetailSkeleton,
  PostListSkeleton,
  QuestionSkeleton,
  RowListSkeleton,
} from "./Skeleton";
import { themedStyles } from "@/components/themedStyles";

// ─── Loading / empty / error shells ────────────────────────────────
// Every async surface in the app renders one of these. `LoadingState` takes a
// `variant` so the placeholder matches the shape of the content that is
// coming — the layout holds still instead of jumping when data lands. The
// `mascot` variant is for waits long enough to deserve a face.

export type LoadingVariant =
  | "block"
  | "post"
  | "rows"
  | "cards"
  | "detail"
  | "question"
  | "calendar"
  | "mascot";

export function LoadingState({
  message,
  variant = "block",
  count,
}: {
  message?: string;
  variant?: LoadingVariant;
  count?: number;
}) {
  if (variant === "mascot") {
    return (
      <View style={styles.center}>
        <MascotLoader message={message} />
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <View style={styles.fill}>
        {variant === "post" && <PostListSkeleton count={count ?? 3} />}
        {variant === "rows" && <RowListSkeleton count={count ?? 4} />}
        {variant === "cards" && <CardListSkeleton count={count ?? 4} />}
        {variant === "detail" && <DetailSkeleton />}
        {variant === "question" && <QuestionSkeleton />}
        {variant === "calendar" && <CalendarSkeleton />}
        {variant === "block" && <BlockSkeleton count={count ?? 3} />}
      </View>
      {!!message && (
        <Text
          style={styles.caption}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  pose = "idle",
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Which Stax pose sits above the copy. */
  pose?: MascotPose;
}) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(duration.enter)}
      style={styles.center}
    >
      <Mascot pose={pose} size={104} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{body}</Text>
      {!!actionLabel && (
        <Button
          title={actionLabel}
          variant="secondary"
          onPress={onAction}
          style={{ marginTop: theme.spacing.md }}
        />
      )}
    </Animated.View>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  message = "Something went wrong.",
  actionLabel = "Try again",
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(duration.enter)}
      style={styles.center}
    >
      <Mascot pose="error" size={96} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{message}</Text>
      {onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </Animated.View>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  const reduce = useReducedMotion();
  // One success haptic per appearance — it follows a user action.
  useEffect(() => {
    haptic("success");
  }, []);
  return (
    <Animated.View
      entering={
        reduce
          ? FadeIn.duration(duration.small)
          : FadeInDown.duration(duration.enter).easing(ease.out)
      }
      style={styles.success}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <TickIcon size={18} color={theme.colors.onPrimary} />
      <Text style={styles.successText}>{message}</Text>
    </Animated.View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    // Loading: skeletons own the space; the caption sits under them.
    wrap: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    fill: { width: "100%" },
    caption: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.type.title,
      color: theme.colors.text,
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
    hint: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
      maxWidth: 320,
    },

    success: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.success,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    successText: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.onPrimary,
      textAlign: "center",
    },
  }),
);

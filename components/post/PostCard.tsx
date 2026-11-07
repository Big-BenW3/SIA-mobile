import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import type { Post } from "@/types";
import { dueTone, formatDateTime, formatDue } from "@/utils/due";
import {
  CourseTag,
  DifficultyDot,
  PostTypeChip,
} from "@/components/shared/Chips";
import { ClockIcon, FileIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { themedStyles } from "@/components/themedStyles";

// ─── Post card ─────────────────────────────────────────────────────
// One card for every place a CR post is listed (student home, student feed,
// CR feed). Top row = what it is; title = the point; footer = who/when and
// the deadline, which is the thing a student actually needs, so it gets the
// colour: danger when past due, warning inside two days, neutral otherwise.

const TONE_COLOR = {
  past: theme.colors.danger,
  soon: theme.colors.warning,
  later: theme.colors.secondary,
  none: theme.colors.secondary,
} as const;

export function PostCard({
  post,
  onPress,
  footer,
}: {
  post: Post;
  onPress: () => void;
  /** Extra row under the meta (e.g. the CR's Edit shortcut). */
  footer?: React.ReactNode;
}) {
  const due = formatDue(post.dueDate);
  const tone = dueTone(post.dueDate);
  const color = TONE_COLOR[tone];

  return (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${post.courseCode} ${post.postType}: ${post.title}${due ? `, ${due}` : ""}`}
    >
      <View style={styles.top}>
        <CourseTag code={post.courseCode} />
        <PostTypeChip type={post.postType} />
        <DifficultyDot level={post.difficulty} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {post.title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText} numberOfLines={1}>
          {post.author} · {formatDateTime(post.createdAt)}
        </Text>
        {post.fileUrl ? (
          <FileIcon size={16} color={theme.colors.secondary} />
        ) : null}
      </View>
      {due ? (
        <View style={styles.due}>
          <ClockIcon size={16} color={color} />
          <Text style={[styles.dueText, { color }]}>{due}</Text>
        </View>
      ) : null}
      {footer}
    </PressableScale>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.xs,
      ...theme.shadow.card,
    },
    top: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs },
    metaText: { ...theme.type.caption, color: theme.colors.secondary, flex: 1 },
    due: { flexDirection: "row", alignItems: "center", gap: 6 },
    dueText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);

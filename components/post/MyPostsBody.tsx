import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { themedStyles } from "@/components/themedStyles";

// ─── MyPostsBody (CR post manager, no chrome) ───────────────────────
// Mine/All-level toggle filters for real on `post.mine`; tapping a card
// opens the read-only detail, Edit jumps straight to the form. Parents
// own headers and FAB placement context.

export function MyPostsBody() {
  const router = useRouter();
  const { posts, status, error, load } = usePostsStore();
  const levelId = useSessionStore((s) => s.levelId);
  const [tab, setTab] = useState<"Mine" | "All level">("Mine");

  const visible = tab === "Mine" ? posts.filter((p) => p.mine) : posts;

  if (status === "loading" && posts.length === 0) {
    return (
      <View style={styles.wrap}>
        <LoadingState variant="post" message="Loading your posts…" />
      </View>
    );
  }

  if (status === "error" && posts.length === 0) {
    return (
      <View style={styles.wrap}>
        <ErrorState
          message={error}
          actionLabel="Retry"
          onAction={() => load(levelId ?? undefined)}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {(["Mine", "All level"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.pill, tab === t && styles.pillActive]}
          >
            <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
              {t === "Mine" ? "Mine" : "All level (Main CR)"}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={tab === "Mine" ? "No posts yet" : "Nothing from assistants"}
            body={
              tab === "Mine"
                ? "Your published updates live here with Upcoming / Past-due status."
                : "Assistant CR posts for your level will appear here."
            }
            actionLabel={tab === "Mine" ? "Write your first post" : undefined}
            onAction={
              tab === "Mine"
                ? () => router.push("/(cr)/posts/new" as never)
                : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(cr)/post/${item.id}` as never)}
            style={styles.card}
          >
            <View style={styles.top}>
              <Text style={styles.code}>{item.courseCode}</Text>
              <Text style={[styles.status, item.pastDue && styles.past]}>
                {item.pastDue ? "Past due" : "Upcoming"}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.postType} · {item.createdAt}
            </Text>
            {/* stopPropagation: Edit must not also open the detail. */}
            <Pressable
              onPress={(e: GestureResponderEvent) => {
                e.stopPropagation();
                router.push(`/(cr)/posts/${item.id}/edit` as never);
              }}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push("/(cr)/posts/new" as never)}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+ New post</Text>
      </Pressable>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { flex: 1 },
    toggle: {
      flexDirection: "row",
      gap: 8,
      padding: theme.spacing.md,
      paddingBottom: 0,
    },
    pill: {
      flex: 1,
      minHeight: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    pillActive: {
      backgroundColor: theme.colors.inverseSurface,
      borderColor: theme.colors.inverseSurface,
    },
    pillText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      fontSize: 13,
    },
    pillTextActive: { color: theme.colors.onInverseSurface },
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
      ...theme.shadow.card,
    },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    code: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 13,
      color: theme.colors.accent,
    },
    status: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.easy,
      backgroundColor: "#E7F6EF",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      overflow: "hidden",
    },
    past: {
      color: theme.colors.secondary,
      backgroundColor: theme.colors.muted,
    },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 8,
    },
    editBtn: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.muted,
      borderRadius: 999,
      paddingHorizontal: 16,
      minHeight: 36,
      justifyContent: "center",
    },
    editText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 13,
      color: theme.colors.text,
    },
    list: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance + 72,
    },
    fab: {
      position: "absolute",
      bottom: theme.layout.tabClearance,
      left: 16,
      right: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    fabText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);

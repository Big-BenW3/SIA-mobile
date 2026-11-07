import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { SelectChip } from "@/components/shared/Chips";
import { PenIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { useDockTop } from "@/components/shared/Dock";
import { PostCard } from "./PostCard";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { themedStyles } from "@/components/themedStyles";

// ─── MyPostsBody (CR post manager, no chrome) ───────────────────────
// Mine / All-level filter works on `post.mine`; tapping a card opens the
// detail, Edit jumps straight to the form. Parents own headers.

type Scope = "mine" | "all";

export function MyPostsBody() {
  const router = useRouter();
  const dockTop = useDockTop();
  const { posts, status, error, load } = usePostsStore();
  const levelId = useSessionStore((s) => s.levelId);
  const [scope, setScope] = useState<Scope>("mine");

  const visible = scope === "mine" ? posts.filter((p) => p.mine) : posts;

  if (status === "loading" && posts.length === 0) {
    return <LoadingState variant="post" message="Loading your posts…" />;
  }
  if (status === "error" && posts.length === 0) {
    return (
      <ErrorState
        message={error}
        actionLabel="Retry"
        onAction={() => load(levelId ?? undefined)}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.chips}>
            <SelectChip
              label="Mine"
              selected={scope === "mine"}
              onPress={() => setScope("mine")}
            />
            <SelectChip
              label="All level"
              selected={scope === "all"}
              onPress={() => setScope("all")}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            pose={scope === "mine" ? "point" : "sleep"}
            title={scope === "mine" ? "No posts yet" : "Nothing here yet"}
            body={
              scope === "mine"
                ? "Your published updates live here, with their due dates."
                : "Posts from every CR in your level will appear here."
            }
            actionLabel={scope === "mine" ? "Write your first post" : undefined}
            onAction={
              scope === "mine"
                ? () => router.push("/(cr)/posts/new" as never)
                : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/(cr)/post/${item.id}` as never)}
            footer={
              <PressableScale
                onPress={(e) => {
                  e.stopPropagation?.();
                  router.push(`/(cr)/posts/${item.id}/edit` as never);
                }}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit post"
              >
                <Text style={styles.editText}>Edit</Text>
              </PressableScale>
            }
          />
        )}
      />
      <PressableScale
        onPress={() => router.push("/(cr)/posts/new" as never)}
        haptic="light"
        style={[styles.fab, { bottom: dockTop + theme.spacing.md }]}
        accessibilityRole="button"
        accessibilityLabel="New post"
      >
        <PenIcon color={theme.colors.onPrimary} size={20} />
        <Text style={styles.fabText}>New post</Text>
      </PressableScale>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { flex: 1 },
    list: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance + 72,
      flexGrow: 1,
    },
    chips: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    editBtn: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      minHeight: 36,
      justifyContent: "center",
    },
    editText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    fab: {
      position: "absolute",
      right: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      minHeight: 52,
      paddingHorizontal: theme.spacing.lg,
      ...theme.shadow.card,
    },
    fabText: {
      ...theme.type.body,
      color: theme.colors.onPrimary,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);

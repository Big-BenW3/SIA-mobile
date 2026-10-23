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
import { AppHeader } from "@/components/shared/AppHeader";
import {
  CourseTag,
  DifficultyDot,
  PostTypeChip,
} from "@/components/shared/Chips";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { formatDateTime, formatDue } from "@/utils/due";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// CR Home: the level feed with a composer on top. Cards open the detail
// (which owns Edit/Delete); the inline Edit shortcut stops propagation
// so it never also opens the detail.
export default function CRHome() {
  const router = useRouter();
  const { posts, status, error, load } = usePostsStore();
  const levelId = useSessionStore((s) => s.levelId);
  const [filter, setFilter] = useState("All");

  if (status === "loading" && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Level feed · CR" />
        <LoadingState variant="post" message="Loading your level feed…" />
      </SafeAreaView>
    );
  }

  if (status === "error" && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Level feed · CR" />
        <ErrorState
          message={error}
          actionLabel="Retry"
          onAction={() => load(levelId ?? undefined)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Level feed · CR" />
      <FlatList
        data={posts.filter((p) =>
          filter === "All" ? true : p.postType === filter,
        )}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.push("/(cr)/posts/new" as never)}
              style={styles.composer}
            >
              <Text style={styles.composerText}>
                + Share an update with 300L…
              </Text>
            </Pressable>
            <View style={styles.chips}>
              {["All", "assignment", "test", "lecture", "announcement"].map(
                (f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.chip, filter === f && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filter === f && styles.chipTextActive,
                      ]}
                    >
                      {f === "All" ? "All" : f}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No posts yet"
            body="Publish the first update for your level. It notifies everyone instantly."
            actionLabel="New post"
            onAction={() => router.push("/(cr)/posts/new" as never)}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(cr)/post/${item.id}` as never)}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <CourseTag code={item.courseCode} />
              <PostTypeChip type={item.postType} />
              <DifficultyDot level={item.difficulty} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.author} · {formatDateTime(item.createdAt)}
              {formatDue(item.dueDate) ? ` · ${formatDue(item.dueDate)}` : ""}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  router.push(`/(cr)/posts/${item.id}/edit` as never);
                }}
                style={styles.editBtn}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    list: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance,
    },
    composer: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: 8,
    },
    composerText: {
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    chips: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
    chip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      minHeight: 36,
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: theme.colors.inverseSurface,
      borderColor: theme.colors.inverseSurface,
    },
    chipText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 12,
      color: theme.colors.text,
    },
    chipTextActive: { color: theme.colors.onInverseSurface },
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: 8,
      ...theme.shadow.card,
    },
    cardTop: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 8,
    },
    cardTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    cardMeta: { ...theme.type.caption, color: theme.colors.secondary },
    actions: { flexDirection: "row", gap: 8, marginTop: 8 },
    editBtn: {
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
  }),
);

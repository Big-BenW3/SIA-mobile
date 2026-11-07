import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { BookIcon, ChevronIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { useSessionStore } from "@/stores/sessionStore";
import { themedStyles } from "@/components/themedStyles";

// ─── Courses → files (shared, both roles) ───────────────────────────
// Courses + file counts come from the session store (level + semester scoped
// at login). Loading/error shells with retry; pull to refresh. Tapping a
// course opens its files in the caller's own stack.

export function CourseList({
  base,
  emptyBody,
}: {
  base: "(student)" | "(cr)";
  emptyBody: string;
}) {
  const router = useRouter();
  const { courses, resources, status, error, load } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading" && courses.length === 0) {
    return <LoadingState variant="cards" message="Loading your courses…" />;
  }
  if (status === "error" && courses.length === 0) {
    return (
      <ErrorState message={error} actionLabel="Retry" onAction={() => load()} />
    );
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      ListEmptyComponent={
        <EmptyState pose="read" title="No courses yet" body={emptyBody} />
      }
      renderItem={({ item }) => {
        const count = resources.filter((f) => f.courseId === item.id).length;
        return (
          <PressableScale
            onPress={() =>
              router.push(`/${base}/resources/${item.id}` as never)
            }
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`${item.courseCode} ${item.courseTitle}, ${count} file${count === 1 ? "" : "s"}`}
          >
            <View style={styles.icon}>
              <BookIcon color={theme.colors.accent} />
            </View>
            <View style={styles.body}>
              <Text style={styles.code}>{item.courseCode}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.courseTitle}
              </Text>
              <Text style={styles.meta}>
                {count} file{count === 1 ? "" : "s"} · {item.creditUnit} units
              </Text>
            </View>
            <ChevronIcon />
          </PressableScale>
        );
      }}
    />
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    list: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance,
      flexGrow: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
      minHeight: theme.layout.rowMinHeight,
      ...theme.shadow.card,
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, gap: 2 },
    code: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

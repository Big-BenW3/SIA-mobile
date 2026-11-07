import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import type { PostType } from "@/types";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { SelectChip } from "@/components/shared/Chips";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { PostCard } from "./PostCard";
import { themedStyles } from "@/components/themedStyles";

// ─── Level feed ────────────────────────────────────────────────────
// The list of CR posts for the user's level, with type filters and pull to
// refresh. Shared by the student Updates screen and the CR home; `base` picks
// which role's detail route a card opens. `header` sits above the filters
// (the CR composer), `renderFooter` adds per-card actions (the CR Edit link).

type Filter = "all" | PostType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "assignment", label: "Assignments" },
  { key: "test", label: "Tests" },
  { key: "lecture", label: "Lectures" },
  { key: "announcement", label: "Notices" },
];

export function PostFeed({
  base,
  header,
  renderFooter,
  emptyAction,
}: {
  base: "(student)" | "(cr)";
  header?: React.ReactNode;
  renderFooter?: (postId: string) => React.ReactNode;
  emptyAction?: { label: string; onPress: () => void; body?: string };
}) {
  const router = useRouter();
  const { posts, status, error, load } = usePostsStore();
  const levelId = useSessionStore((s) => s.levelId);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const data = useMemo(
    () =>
      filter === "all" ? posts : posts.filter((p) => p.postType === filter),
    [posts, filter],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(levelId ?? undefined);
    } finally {
      setRefreshing(false);
    }
  }, [load, levelId]);

  if (status === "loading" && posts.length === 0) {
    return <LoadingState variant="post" message="Loading your level feed…" />;
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
    <FlatList
      data={data}
      keyExtractor={(p) => p.id}
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
      ListHeaderComponent={
        <View style={styles.head}>
          {header}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {FILTERS.map((f) => (
              <SelectChip
                key={f.key}
                label={f.label}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        filter === "all" ? (
          <EmptyState
            pose="sleep"
            title="No posts yet"
            body={
              emptyAction?.body ??
              "When your CR posts an assignment, test or notice, it shows up here."
            }
            actionLabel={emptyAction?.label}
            onAction={emptyAction?.onPress}
          />
        ) : (
          <EmptyState
            pose="read"
            title="Nothing here"
            body="No posts of this type yet."
            actionLabel="Show all"
            onAction={() => setFilter("all")}
          />
        )
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push(`/${base}/post/${item.id}` as never)}
          footer={renderFooter?.(item.id)}
        />
      )}
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
    head: { gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
    chips: { gap: theme.spacing.xs, paddingRight: theme.spacing.md },
  }),
);

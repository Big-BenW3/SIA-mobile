import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { useSessionStore } from "@/stores/sessionStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── CR Files tab (real backend) ────────────────────────────────────
// Same course list students see; tapping a course opens the manager
// (upload + delete) for that course.

export default function ResourcesHome() {
  const router = useRouter();
  const { courses, resources, status, error, load } = useSessionStore();

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Resources" />
        <LoadingState variant="cards" message="Loading your courses…" />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Resources" />
        <ErrorState
          message={error}
          actionLabel="Retry"
          onAction={() => load()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Resources" />
      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No courses yet"
            body="Courses for your level appear here once admin adds them for the semester."
          />
        }
        renderItem={({ item }) => {
          const count = resources.filter((f) => f.courseId === item.id).length;
          return (
            <Pressable
              onPress={() => router.push(`/(cr)/resources/${item.id}` as never)}
              style={styles.row}
            >
              <View style={styles.icon}>
                <Text style={styles.iconText}>▤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{item.courseCode}</Text>
                <Text style={styles.title}>{item.courseTitle}</Text>
                <Text style={styles.meta}>
                  {count} file{count === 1 ? "" : "s"} · {item.creditUnit} units
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          );
        }}
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      marginBottom: 8,
      minHeight: theme.layout.rowMinHeight,
      ...theme.shadow.card,
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { fontSize: 20, color: theme.colors.accent },
    code: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 13,
      color: theme.colors.accent,
    },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
    chev: { fontSize: 24, color: theme.colors.secondary },
  }),
);

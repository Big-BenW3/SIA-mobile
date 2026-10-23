import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { formatDateTime } from "@/utils/due";

// ─── CR CourseResources (read-only) ─────────────────────────────────
// The files library is admin-managed: CRs read here exactly like
// students. CRs attach files to their own posts instead (New Post).
// Unknown courses 404.

export default function CRCourseResources() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { courses, resources, status, error, load } = useSessionStore();
  const course = courses.find((c) => c.id === courseId);

  if (status === "loading") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Files" showBack />
        <LoadingState variant="cards" message="Loading files…" />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Files" showBack />
        <ErrorState
          message={error}
          actionLabel="Retry"
          onAction={() => load()}
        />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Files" showBack />
        <ErrorState
          title="Course not found"
          message="This course may have been removed."
          actionLabel="Back to files"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const files = resources.filter((f) => f.courseId === course.id);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <AppHeader title={course.courseCode} showBack />
      <FlatList
        data={files}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No resources yet"
            body={`Nothing uploaded for ${course.courseCode} this semester. Only admins add library files.`}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => Linking.openURL(item.fileUrl)}
            style={styles.row}
          >
            <View style={styles.icon}>
              <Text style={styles.iconText}>
                {item.fileType.slice(0, 3).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.fileType.toUpperCase()} · {formatDateTime(item.createdAt)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    list: { padding: theme.spacing.md },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      marginBottom: 8,
      ...theme.shadow.card,
      backgroundColor: theme.colors.surface,
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { fontSize: 20 },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

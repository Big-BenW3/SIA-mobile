import { useEffect, useState } from "react";
import { FlatList, Linking, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { AddIcon, TrashIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { FormError } from "@/components/shared/AuthScreen";
import { UploadSheet } from "@/components/resources/UploadSheet";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { sessionApi, type ResourceDto } from "@/services/session.service";
import { ApiError } from "@/services/api";
import { formatDateTime } from "@/utils/due";
import { confirmAction } from "@/utils/confirm";
import { themedStyles } from "@/components/themedStyles";

// ─── Course files (shared, both roles) ──────────────────────────────
// Everyone in the level reads the library. With `canManage` (CR screens) a CR
// can also upload into the course and delete files they uploaded — or any file
// in their level if they are its Main CR (the server enforces the same rules).
// Tapping a file hands its URL to the system viewer; if that fails we say so
// instead of doing nothing.

export function CourseFiles({
  emptyHint,
  canManage = false,
}: {
  emptyHint: string;
  canManage?: boolean;
}) {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    courses,
    resources,
    semester,
    status,
    error,
    load,
    refreshResources,
  } = useSessionStore();
  const [notice, setNotice] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  // Each open remounts the sheet, so the form is fresh without effect resets.
  const [openCount, setOpenCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const course = courses.find((c) => c.id === courseId);

  // The signed-in session doesn't carry the user id; read it once so we can
  // tell which files this CR uploaded (only needed when they can manage).
  useEffect(() => {
    if (!canManage) return;
    let live = true;
    sessionApi.me().then(
      (m) => {
        if (live) setMyId(m.id);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [canManage]);

  const open = async (url: string) => {
    setNotice("");
    try {
      await Linking.openURL(url);
    } catch {
      setNotice(
        "Couldn't open this file. Check your connection and try again.",
      );
    }
  };

  const mayDelete = (f: ResourceDto) =>
    canManage &&
    ((!!myId && f.uploadedBy === myId) || user?.roleInLevel === "main_cr");

  const remove = async (f: ResourceDto) => {
    const ok = await confirmAction({
      title: "Delete this file?",
      message: `"${f.title}" will be removed for everyone in the level.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setNotice("");
    setDeletingId(f.id);
    try {
      await sessionApi.deleteResource(f.id);
      await refreshResources();
    } catch (err) {
      setNotice(
        err instanceof ApiError
          ? err.message
          : "Couldn't delete the file. Try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  let content: React.ReactNode;
  let title = "Files";

  if (status === "loading" && courses.length === 0) {
    content = <LoadingState variant="cards" message="Loading files…" />;
  } else if (status === "error" && courses.length === 0) {
    content = (
      <ErrorState message={error} actionLabel="Retry" onAction={() => load()} />
    );
  } else if (!course) {
    content = (
      <ErrorState
        title="Course not found"
        message="This course may have been removed."
        actionLabel="Back to files"
        onAction={() => router.back()}
      />
    );
  } else {
    title = course.courseCode;
    const files = resources.filter((f) => f.courseId === course.id);
    content = (
      <>
        <FlatList
          data={files}
          keyExtractor={(f) => f.id}
          contentContainerStyle={[
            styles.list,
            canManage && { paddingBottom: 96 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<FormError message={notice} />}
          ListEmptyComponent={
            <EmptyState
              pose="read"
              title="No files yet"
              body={`Nothing uploaded for ${course.courseCode} this semester. ${emptyHint}`}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <PressableScale
                onPress={() => open(item.fileUrl)}
                style={styles.row}
                accessibilityRole="link"
                accessibilityLabel={`${item.title}, ${item.fileType}. Opens the file.`}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.fileType.slice(0, 4).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta}>
                    {item.fileType.toUpperCase()} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </PressableScale>
              {mayDelete(item) && (
                <PressableScale
                  onPress={() => remove(item)}
                  disabled={deletingId === item.id}
                  hitSlop={8}
                  style={[
                    styles.trash,
                    deletingId === item.id && { opacity: 0.4 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.title}`}
                >
                  <TrashIcon color={theme.colors.danger} />
                </PressableScale>
              )}
            </View>
          )}
        />
        {canManage && (
          <>
            <PressableScale
              onPress={() => {
                setOpenCount((c) => c + 1);
                setUploadOpen(true);
              }}
              haptic="light"
              style={[
                styles.fab,
                {
                  bottom:
                    Math.max(insets.bottom, theme.spacing.sm) +
                    theme.spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload file"
            >
              <AddIcon color={theme.colors.onPrimary} size={20} />
              <Text style={styles.fabText}>Upload file</Text>
            </PressableScale>
            <UploadSheet
              key={openCount}
              visible={uploadOpen}
              onClose={() => setUploadOpen(false)}
              course={course}
              semester={semester}
              onUploaded={() => {
                setNotice("");
                void refreshResources();
              }}
            />
          </>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={title} showBack />
      {content}
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    list: { padding: theme.spacing.md, flexGrow: 1 },
    rowWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    row: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      ...theme.shadow.card,
    },
    badge: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
      letterSpacing: 0.5,
    },
    body: { flex: 1, gap: 2 },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
    trash: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
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

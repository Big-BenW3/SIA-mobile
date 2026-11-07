import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { PenIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { NotificationPrimer } from "@/components/shared/NotificationPrimer";
import { PostFeed } from "@/components/post/PostFeed";
import { useSessionStore } from "@/stores/sessionStore";
import { themedStyles } from "@/components/themedStyles";

// CR Home: the level feed with a composer on top. Cards open the detail
// (which owns Edit/Delete); the inline Edit shortcut sits in the card footer.
export default function CRHome() {
  const router = useRouter();
  const levelName = useSessionStore((s) => s.levelName);

  const header = (
    <View style={styles.head}>
      <NotificationPrimer />
      <PressableScale
        onPress={() => router.push("/(cr)/posts/new" as never)}
        haptic="light"
        style={styles.composer}
        accessibilityRole="button"
        accessibilityLabel="Share an update"
      >
        <View style={styles.composerIcon}>
          <PenIcon color={theme.colors.onPrimary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.composerTitle}>Share an update</Text>
          <Text style={styles.composerBody}>
            Notifies everyone in {levelName || "your level"} instantly.
          </Text>
        </View>
      </PressableScale>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Level feed" />
      <PostFeed
        base="(cr)"
        header={header}
        emptyAction={{
          label: "New post",
          onPress: () => router.push("/(cr)/posts/new" as never),
          body: "Publish the first update for your level. It notifies everyone instantly.",
        }}
        renderFooter={(id) => (
          <PressableScale
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/(cr)/posts/${id}/edit` as never);
            }}
            style={styles.editBtn}
            accessibilityRole="button"
            accessibilityLabel="Edit post"
          >
            <Text style={styles.editText}>Edit</Text>
          </PressableScale>
        )}
      />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    head: { gap: theme.spacing.xs },
    composer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    composerIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    composerTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    composerBody: { ...theme.type.caption, color: theme.colors.secondary },
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
  }),
);

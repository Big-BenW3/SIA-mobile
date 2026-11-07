import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration } from "@/constants/motion";
import { useNotificationStore } from "@/stores/appStores";
import { useSessionStore } from "@/stores/sessionStore";
import { BackIcon, BellIcon } from "@/components/shared/Icons";
import { LogoMark } from "@/components/brand/Logos";
import { PressableScale } from "@/components/shared/PressableScale";
import { themedStyles } from "@/components/themedStyles";

export function AppHeader({
  title,
  showBack,
  onBack,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { setNotificationsOpen, unread } = useNotificationStore();
  const session = useSessionStore();
  const meta = [
    session.levelName,
    session.semester ? `${session.semester} Semester` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <PressableScale
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackIcon />
          </PressableScale>
        ) : (
          <View style={styles.brandBox}>
            <LogoMark size={40} />
          </View>
        )}
        <View style={styles.titles}>
          <Text
            style={styles.title}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {!!meta && (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        <PressableScale
          onPress={() => setNotificationsOpen(true)}
          hitSlop={8}
          style={styles.bell}
          accessibilityRole="button"
          accessibilityLabel={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <BellIcon />
          {unread > 0 && (
            <Animated.View
              entering={reduce ? undefined : FadeIn.duration(duration.small)}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>
                {unread > 99 ? "99+" : unread}
              </Text>
            </Animated.View>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    brandBox: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    back: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -theme.spacing.xs,
    },
    titles: { flex: 1 },
    title: { ...theme.type.title, color: theme.colors.text },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
    bell: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
  }),
);

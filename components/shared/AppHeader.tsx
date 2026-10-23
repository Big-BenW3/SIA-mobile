import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useNotificationStore } from "@/stores/appStores";
import { useSessionStore } from "@/stores/sessionStore";
import { BellIcon } from "@/components/shared/Icons";

import { useBrandStore } from "@/stores/brandStore";
import { LogoMark } from "@/components/brand/Logos";
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
  const { setNotificationsOpen, unread } = useNotificationStore();
  const session = useSessionStore();
  // Real academic context only — no hard-coded fallback. Before the session
  // load resolves the line is simply absent rather than lying about a level.
  const meta = [
    session.levelName,
    session.semester ? `${session.semester} Semester` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const { choice } = useBrandStore();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={16}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : choice ? (
          // Live preview of the logo picked on the concept screen.
          <LogoMark choice={choice} size={40} />
        ) : (
          <Text style={styles.logo}>SIA</Text>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>
        <Pressable
          onPress={() => setNotificationsOpen(true)}
          hitSlop={12}
          style={styles.bell}
        >
          <BellIcon />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </Pressable>
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
      paddingVertical: theme.spacing.sm,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    logo: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.onPrimary,
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
      overflow: "hidden",
    },
    back: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: {
      fontSize: 28,
      color: theme.colors.text,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
    title: { ...theme.type.title, color: theme.colors.text },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
    bell: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    bellIcon: { fontSize: 22 },
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
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: 11,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
  }),
);

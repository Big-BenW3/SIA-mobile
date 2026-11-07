import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { theme } from "@/constants/theme";
import { ease, spring } from "@/constants/motion";
import { useNotificationStore } from "@/stores/appStores";
import { useAuthStore } from "@/stores/authStore";
import { timeAgo } from "@/utils/due";
import { CloseIcon } from "./Icons";
import { EmptyState, ErrorState } from "./States";
import { PressableScale } from "./PressableScale";
import { RowListSkeleton } from "./Skeleton";
import { themedStyles } from "@/components/themedStyles";

// ─── Notification panel ────────────────────────────────────────────
// Server list with local read state; push arrives via Expo Push and lands here
// on the next load (we also refresh every time the sheet opens).
//
// One sheet, two detents. It opens as a peek (about half the screen); drag up
// to expand, drag down to shrink or dismiss. Everything moves with translateY
// on the UI runtime: the sheet is always laid out at full height and slid, so
// no layout work happens during a drag. Release picks the nearest detent from
// where the sheet is GOING (position + velocity), so a quick flick is enough.

const PEEK_RATIO = 0.52;
const FULL_RATIO = 0.92;

export function NotificationPanel() {
  const {
    notificationsOpen,
    setNotificationsOpen,
    list,
    unread,
    markRead,
    markAllRead,
    status,
    load,
  } = useNotificationStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // Deep-link into the viewer's own stack (student ⇄ CR share post IDs).
  const home = user?.role === "cr" ? "/(cr)" : "/(student)";

  const fullHeight = Math.round(screenHeight * FULL_RATIO);
  const peekHeight = Math.round(screenHeight * PEEK_RATIO);
  const peekY = fullHeight - peekHeight; // translateY at the peek detent
  const hiddenY = fullHeight; // fully off-screen

  const y = useSharedValue(hiddenY);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Mount the Modal (and reset to the peek detent) the render the store flag
  // turns true: derived state adjusted during render, not in an effect.
  if (notificationsOpen && !mounted) setMounted(true);

  // Runs on the RN runtime once the exit animation completes.
  const onClosed = () => {
    setMounted(false);
    setExpanded(false);
  };

  // Single path for open and close: the store flag drives the animation.
  useEffect(() => {
    if (notificationsOpen) {
      y.set(hiddenY);
      y.set(
        withTiming(peekY, {
          duration: reduce ? 0 : 300,
          easing: ease.sheet,
        }),
      );
      void load();
    } else {
      y.set(
        withTiming(
          hiddenY,
          { duration: reduce ? 0 : 220, easing: ease.out },
          (finished) => {
            if (finished) scheduleOnRN(onClosed);
          },
        ),
      );
    }
    // load/y are stable; detents only change on rotation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsOpen]);

  const startY = useRef(0);
  const pan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          cancelAnimation(y);
          startY.current = y.get();
        },
        onPanResponderMove: (_e, g) => {
          const raw = startY.current + g.dy;
          // Rubber-band above the full detent instead of a hard stop.
          y.set(raw < 0 ? raw * 0.25 : raw);
        },
        onPanResponderRelease: (_e, g) => {
          // Project where the flick is heading (vy is px/ms), then snap to the
          // nearest detent: velocity OR distance, never distance alone.
          const projected = y.get() + g.vy * 220;
          const detents = [0, peekY, hiddenY];
          const target = detents.reduce((best, d) =>
            Math.abs(d - projected) < Math.abs(best - projected) ? d : best,
          );
          if (target === hiddenY) {
            setNotificationsOpen(false);
            return;
          }
          setExpanded(target === 0);
          y.set(
            withSpring(target, {
              ...spring.sheet,
              velocity: g.vy * 1000,
              overshootClamping: true,
            }),
          );
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peekY, hiddenY, setNotificationsOpen],
  );

  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }],
  }));
  const scrim = useAnimatedStyle(() => ({
    opacity: interpolate(
      y.get(),
      [peekY, hiddenY],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const close = () => setNotificationsOpen(false);

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { height: fullHeight }, sheet]}>
          <View {...pan.panHandlers} style={styles.dragZone}>
            <View style={styles.handle} />
            <View style={styles.headRow}>
              <View style={styles.titleRow}>
                <Text style={styles.title} accessibilityRole="header">
                  Notifications
                </Text>
                {unread > 0 && (
                  <View style={styles.count}>
                    <Text style={styles.countText}>{unread}</Text>
                  </View>
                )}
              </View>
              <View style={styles.headActions}>
                {unread > 0 && (
                  <PressableScale
                    onPress={markAllRead}
                    hitSlop={8}
                    style={styles.textBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.textBtnLabel}>Mark all read</Text>
                  </PressableScale>
                )}
                <PressableScale
                  onPress={close}
                  hitSlop={8}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <CloseIcon size={20} />
                </PressableScale>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.list,
              {
                // At peek the lower part of the sheet is off-screen; pad the
                // end so the last rows can still be scrolled into view.
                paddingBottom:
                  Math.max(insets.bottom, theme.spacing.md) +
                  (expanded ? 0 : peekY),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {status === "loading" && list.length === 0 && (
              <RowListSkeleton count={3} leading={36} />
            )}
            {status === "error" && list.length === 0 && (
              <ErrorState
                title="Couldn't load notifications"
                message="Check your connection and try again."
                actionLabel="Retry"
                onAction={load}
              />
            )}
            {status !== "loading" &&
              status !== "error" &&
              list.length === 0 && (
                <View style={styles.empty}>
                  <EmptyState
                    pose="sleep"
                    title="All caught up"
                    body="New posts and replies will land here."
                  />
                </View>
              )}
            {list.map((n) => {
              const isUnread = !n.read;
              return (
                <PressableScale
                  key={n.id}
                  onPress={() => {
                    markRead(n.id);
                    close();
                    if (n.postId)
                      router.push(`${home}/post/${n.postId}` as never);
                  }}
                  style={[styles.row, isUnread && styles.unread]}
                  accessibilityRole="button"
                  accessibilityLabel={`${isUnread ? "Unread. " : ""}${n.title}. ${n.body}`}
                >
                  <View style={[styles.pip, isUnread && styles.pipUnread]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.nTitle}>{n.title}</Text>
                    <Text style={styles.nBody}>{n.body}</Text>
                    <Text style={styles.nMeta}>{timeAgo(n.createdAt)}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    scrim: { backgroundColor: theme.colors.scrim },
    sheet: {
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
      backgroundColor: theme.colors.sheet,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      overflow: "hidden",
    },
    dragZone: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
    },
    handle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: theme.spacing.xs,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    title: { ...theme.type.title, color: theme.colors.text },
    count: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    countText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.onPrimary,
    },
    headActions: { flexDirection: "row", alignItems: "center" },
    textBtn: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xs,
    },
    textBtnLabel: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: { flex: 1 },
    list: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.xs },
    empty: { minHeight: 260 },
    row: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    unread: {
      backgroundColor: theme.colors.softBlue,
      borderColor: theme.colors.softBlue,
    },
    rowBody: { flex: 1, gap: 2 },
    pip: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
      marginTop: 7,
    },
    pipUnread: { backgroundColor: theme.colors.primary },
    nTitle: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    nBody: { ...theme.type.body, color: theme.colors.body },
    nMeta: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

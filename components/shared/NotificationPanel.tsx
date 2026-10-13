import { useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useNotificationStore } from '@/stores/appStores';
import { Button } from './Button';
import { RowListSkeleton } from './Skeleton';

import { useAuthStore } from '@/stores/authStore';
import { themedStyles } from '@/components/themedStyles';

// Notification panel — server list with local read state; push arrives
// via Expo Push (registered at login) and lands here on next load.
//
// Two heights, one sheet. It opens as a peek (about half the screen) and a
// drag up expands it to full height, drag down shrinks it back, drag down
// from the peek dismisses it. Release in the middle snaps to the nearest detent.
const PEEK_RATIO = 0.52;

export function NotificationPanel() {
  const { notificationsOpen, setNotificationsOpen, list, markRead, markAllRead, status, load } = useNotificationStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  // Full-bleed sheet: it claims the bottom of the screen, so it owns the
  // home-indicator inset rather than inheriting it from a SafeAreaView.
  const insets = useSafeAreaInsets();
  // Deep-link into the viewer's own stack (student ⇄ CR share post IDs).
  const home = user?.role === 'cr' ? '/(cr)' : '/(student)';

  const fullHeight = Math.round(screenHeight * 0.92);
  const peekHeight = Math.round(screenHeight * PEEK_RATIO);
  // Offset from the peek baseline: 0 is peek, negative grows toward full.
  const rise = fullHeight - peekHeight;
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const [anim] = useState(() => new Animated.Value(0));

  const snap = (to: number) => {
    setOffset(to);
    offsetRef.current = to;
    Animated.spring(anim, { toValue: to, useNativeDriver: false, bounciness: 0 }).start();
  };

  const pan = useMemo(
    () =>
      // PanResponder keeps its own internal mutable state; the linter's
      // ref-in-render heuristic does not model that, and this is the
      // documented way to build one.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6,
        onPanResponderGrant: () => anim.stopAnimation(),
        onPanResponderMove: (_e, g) => {
          const next = Math.min(0, Math.max(-rise, offsetRef.current + g.dy));
          anim.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const dragged = offsetRef.current + g.dy;
          if (offsetRef.current === 0 && g.dy > 110) setNotificationsOpen(false);
          else snap(dragged < -rise / 2 ? -rise : 0);
        },
      }),
    // `snap` closes over setOffset (stable) and `rise`, which only changes on
    // rotation — recreating the responder then is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anim, rise, setNotificationsOpen],
  );

  const close = () => {
    setOffset(0);
    offsetRef.current = 0;
    anim.setValue(0);
    setNotificationsOpen(false);
  };

  return (
    <Modal visible={notificationsOpen} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { height: peekHeight, marginBottom: anim }]}>
          <View style={styles.inner} {...pan.panHandlers}>
            <View style={styles.handle} />
            <Text style={styles.title}>Notifications</Text>
          </View>
          <ScrollView
            style={{ maxHeight: offset === 0 ? 420 : fullHeight }}
            contentContainerStyle={styles.list}>
            {status === 'loading' && list.length === 0 && <RowListSkeleton count={3} leading={36} />}
            {status === 'error' && list.length === 0 && (
              <View style={styles.err}>
                <Text style={styles.errText}>Could not load your notifications.</Text>
                <View style={{ height: theme.spacing.xs }} />
                <Button title="Retry" variant="secondary" onPress={load} />
              </View>
            )}
            {status !== 'loading' && status !== 'error' && list.length === 0 && (
              <Text style={styles.nBody}>No notifications yet. New posts and replies will land here.</Text>
            )}
            {list.map((n) => {
              const unread = !n.read;
              return (
              <Pressable
                key={n.id}
                onPress={() => {
                  markRead(n.id);
                  close();
                  if (n.postId) router.push(`${home}/post/${n.postId}` as never);
                }}
                style={[styles.row, unread && styles.unread]}>
                <View style={[styles.pip, unread && styles.pipUnread]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nTitle}>{n.title}</Text>
                  <Text style={styles.nBody}>{n.body}</Text>
                  <Text style={styles.nMeta}>{n.createdAt}</Text>
                </View>
              </Pressable>
              );
            })}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <Button title="Mark all read" variant="secondary" onPress={markAllRead} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Close" variant="secondary" onPress={close} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.sheet,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.spacing.md,
  },
  inner: { paddingHorizontal: theme.spacing.md },
  handle: { width: 48, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 8 },
  title: { ...theme.type.title, color: theme.colors.text, marginBottom: 8 },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm, gap: theme.spacing.xs },
  row: {
    flexDirection: 'row', gap: 12, padding: theme.spacing.sm, marginBottom: theme.spacing.xs,
    borderRadius: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  unread: { backgroundColor: theme.colors.softBlue, borderColor: theme.colors.softBlue },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border, marginTop: 6 },
  pipUnread: { backgroundColor: theme.colors.primary },
  nTitle: { ...theme.type.body, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.text },
  nBody: { ...theme.type.body, color: theme.colors.body },
  nMeta: { ...theme.type.caption, color: theme.colors.secondary },
  err: { alignItems: 'flex-start', paddingVertical: theme.spacing.xs },
  errText: { ...theme.type.body, color: theme.colors.danger },
  footer: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
  footerRow: { flexDirection: 'row', gap: theme.spacing.xs },
}));


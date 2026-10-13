import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';
import { themedStyles } from '@/components/themedStyles';

// ─── Skeleton loaders ──────────────────────────────────────────────
// A placeholder that matches the SHAPE of the content it stands in for.
// A spinner says "something is happening"; a skeleton says "this is what
// is about to arrive", so the layout never jumps when data lands.
//
// The sweep is a single translateX driven by the native thread, so a screen
// full of skeletons costs no JS work per frame.

const SWEEP_MS = 1150;

/** One shimmering block. Size it like the text it replaces. */
export function Skeleton({
  width,
  height = 12,
  radius,
  style,
}: {
  width: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const [measured, setMeasured] = useState(0);
  // Lazy state init rather than a ref: the Animated.Value is created once and
  // then read during render, which is exactly what refs should not do.
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Numeric output only — percentage strings cannot ride the native driver,
  // and the block measures itself on first layout.
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-measured, measured] });

  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[styles.block, { width, height, borderRadius: radius ?? height / 2 }, style]}>
      {measured > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.sheen, { width: measured * 0.6, transform: [{ translateX }] }]}
        />
      )}
    </View>
  );
}

/** Stacked lines standing in for a paragraph. Last line runs short. */
export function SkeletonLines({
  lines = 3,
  width = '100%',
  gap = 8,
}: {
  lines?: number;
  width?: number | `${number}%`;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '62%' : width}
          height={i === lines - 1 ? 10 : 12}
        />
      ))}
    </View>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

// ─── Composed shapes ───────────────────────────────────────────────
// Each mirrors a real card so nothing reflows when the data arrives.

/** Feed post card: course chip, title, two body lines, meta row. */
export function PostCardSkeleton() {
  return (
    <View style={styles.post}>
      <View style={styles.postTop}>
        <Skeleton width={92} height={22} radius={999} />
        <Skeleton width={64} height={10} />
      </View>
      <Skeleton width="78%" height={16} />
      <SkeletonLines lines={2} gap={7} />
      <View style={styles.postFoot}>
        <Skeleton width={110} height={10} />
        <Skeleton width={54} height={10} />
      </View>
    </View>
  );
}

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Feed / list row: leading icon block, title + subtitle. */
export function RowSkeleton({ leading = 44 }: { leading?: number }) {
  return (
    <View style={styles.row}>
      <Skeleton width={leading} height={leading} radius={theme.radius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="72%" height={13} />
        <Skeleton width="46%" height={10} />
      </View>
      <Skeleton width={16} height={16} />
    </View>
  );
}

export function RowListSkeleton({ count = 4, leading = 44 }: { count?: number; leading?: number }) {
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} leading={leading} />
      ))}
    </View>
  );
}

/** Course / resource card: square thumb with a text block beside it. */
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} radius={theme.radius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="66%" height={13} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Detail screen: headline, meta line, body paragraphs. */
export function DetailSkeleton() {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ gap: 10 }}>
        <Skeleton width="44%" height={22} radius={999} />
        <Skeleton width="82%" height={24} />
      </View>
      <Skeleton width="52%" height={10} />
      <SkeletonLines lines={5} gap={9} />
    </View>
  );
}

/** Question runner: progress line, prompt, four choice blocks. */
export function QuestionSkeleton({ choices = 4 }: { choices?: number }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Skeleton width="46%" height={10} />
      <SkeletonLines lines={2} gap={9} />
      <View style={{ gap: theme.spacing.xs }}>
        {Array.from({ length: choices }, (_, i) => (
          <Skeleton key={i} width="100%" height={52} radius={theme.radius.md} />
        ))}
      </View>
    </View>
  );
}

/** Calendar month grid: seven headers and a block of day cells. */
export function CalendarSkeleton() {
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ gap: 6 }}>
        <Skeleton width="52%" height={18} />
        <Skeleton width="34%" height={10} />
      </View>
      <View style={styles.calGrid}>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={`h${i}`} width="100%" height={18} />
        ))}
        {Array.from({ length: 21 }, (_, i) => (
          <Skeleton key={i} width="100%" height={34} radius={theme.radius.sm} />
        ))}
      </View>
    </View>
  );
}

/** Generic block of content, used when no better shape is known. */
export function BlockSkeleton({ count = 3, height = 88 }: { count?: number; height?: number }) {
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} width="100%" height={height} radius={theme.radius.lg} />
      ))}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  block: {
    backgroundColor: theme.colors.muted,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },

  post: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 10,
  },
  postTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    minHeight: theme.layout.rowMinHeight,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    minHeight: theme.layout.rowMinHeight,
  },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
}));

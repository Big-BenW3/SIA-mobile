import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { Button } from './Button';
import {
  BlockSkeleton,
  CalendarSkeleton,
  CardListSkeleton,
  DetailSkeleton,
  PostListSkeleton,
  QuestionSkeleton,
  RowListSkeleton,
} from './Skeleton';
import { themedStyles } from '@/components/themedStyles';

// ─── Loading / empty / error shells ────────────────────────────────
// Every async surface in the app renders one of these. `LoadingState` takes a
// `variant` so the placeholder matches the shape of the content that is
// coming — the layout holds still instead of jumping when data lands.

export type LoadingVariant =
  | 'block'
  | 'post'
  | 'rows'
  | 'cards'
  | 'detail'
  | 'question'
  | 'calendar';

export function LoadingState({
  message,
  variant = 'block',
  count,
}: {
  message?: string;
  variant?: LoadingVariant;
  count?: number;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.fill}>
        {variant === 'post' && <PostListSkeleton count={count ?? 3} />}
        {variant === 'rows' && <RowListSkeleton count={count ?? 4} />}
        {variant === 'cards' && <CardListSkeleton count={count ?? 4} />}
        {variant === 'detail' && <DetailSkeleton />}
        {variant === 'question' && <QuestionSkeleton />}
        {variant === 'calendar' && <CalendarSkeleton />}
        {variant === 'block' && <BlockSkeleton count={count ?? 3} />}
      </View>
      {!!message && (
        <Text style={styles.caption} accessibilityRole="text" accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.dot} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{body}</Text>
      {!!actionLabel && (
        <Button title={actionLabel} variant="secondary" onPress={onAction} style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  message = 'Something went wrong.',
  actionLabel = 'Try again',
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.bang}>
        <Text style={styles.bangText}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{message}</Text>
      {onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <View style={styles.success}>
      <Text style={styles.successText}>✓ {message}</Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  // Loading: skeletons own the space; the caption sits under them.
  wrap: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg, gap: theme.spacing.md },
  fill: { width: '100%' },
  caption: { ...theme.type.caption, color: theme.colors.secondary, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: 8 },
  dot: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.softBlue, marginBottom: 8 },
  bang: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(210,31,60,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bangText: { color: theme.colors.danger, fontSize: 28, fontFamily: theme.font.bold, fontWeight: '700' },
  title: { ...theme.type.title, color: theme.colors.text, textAlign: 'center' },
  hint: { ...theme.type.body, color: theme.colors.secondary, textAlign: 'center' },

  success: {
    backgroundColor: theme.colors.softBlue,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  successText: {
    ...theme.type.body,
    fontWeight: '700',
    fontFamily: theme.font.bold,
    color: theme.colors.accent,
    textAlign: 'center',
  },
}));

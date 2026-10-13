import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { CalendarIcon, FolderIcon, GaugeIcon, PlusIcon } from '@/components/shared/Icons';
import { EmptyState } from '@/components/shared/States';
import { PostListSkeleton, RowListSkeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/shared/Button';
import { useAuthStore } from '@/stores/authStore';
import { HEROES } from '@/data/content';
import { usePostsStore } from '@/stores/postsStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatDateTime, formatDue } from '@/utils/due';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── Home dashboard ─────────────────────────────────────────────────
// Order is deliberate: inspiration (carousel) → shortcuts (actions) →
// orientation (academic week) → obligation (today's schedule) → catch-up.
// Remote photography + local stub data; swap both for CDN/query data later.
const { width } = Dimensions.get('window');
const CARD_W = width - theme.spacing.md * 2;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const firstName = (user?.fullName ?? 'there').split(' ')[0];

  // Carousel page index drives the dots below it.
  const [slide, setSlide] = useState(0);
  const pager = useRef<FlatList>(null);

  // Academic calendar progress (real session state; unset until seeded).
  const {
    week,
    semester,
    sessionYear,
    status: sessionStatus,
    error: sessionError,
    load: loadSession,
  } = useSessionStore();
  const weekPct = week ? Math.round((week.weekNumber / week.totalWeeks) * 100) : 0;

  // Latest CR posts for the catch-up tail (live from the store).
  const { posts, status: postsStatus } = usePostsStore();
  const latest = posts.slice(0, 2);

  // Schedule: nearest dated posts + open personal tasks, merged.
  const { tasks } = usePlannerStore();
  const schedule: { id: string; time: string; title: string; meta: string; kind: 'post' | 'task'; postId?: string }[] = [
    ...posts
      .filter((p) => p.dueDate && !Number.isNaN(new Date(p.dueDate as string).getTime()))
      .slice(0, 2)
      .map((p) => ({
        id: `post-${p.id}`,
        time: new Date(p.dueDate as string).toLocaleDateString(undefined, { weekday: 'short' }),
        title: p.title,
        meta: `${p.courseCode ?? ''} · ${formatDue(p.dueDate) ?? ''}`.trim(),
        kind: 'post' as const,
        postId: p.id,
      })),
    ...tasks
      .filter((t) => t.status === 'pending')
      .slice(0, 3)
      .map((t) => ({
        id: `task-${t.id}`,
        time: t.scheduledDate ?? 'Anytime',
        title: t.title,
        meta: `My task · ${t.difficulty}`,
        kind: 'task' as const,
      })),
  ];

  // Four quick actions: one tap to each core tab screen.
  const actions = [
    { label: 'Calendar', Icon: CalendarIcon, to: '/(student)/calendar' },
    { label: 'New task', Icon: PlusIcon, to: '/(student)/itinerary/add' },
    { label: 'Files', Icon: FolderIcon, to: '/(student)/resources' },
    { label: 'CGPA', Icon: GaugeIcon, to: '/(student)/cgpa/overview' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader title="Home" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 1 ── Greeting: calm, human, one glance. */}
        <Text style={styles.hello}>
          {greeting()}, {firstName}
        </Text>
        <Text style={styles.date}>Here is your level at a glance.</Text>

        {/* A failed session load is explained, not silently rendered as zeros. */}
        {sessionStatus === 'error' && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              {sessionError || 'Could not reach your level right now.'}
            </Text>
            <Button title="Retry" variant="secondary" onPress={loadSession} style={{ marginTop: theme.spacing.xs }} />
          </View>
        )}

        {/* 2 ── Photo carousel: study-life imagery + dots (no autoplay — calm). */}
        <FlatList
          ref={pager}
          data={HEROES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.id}
          onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {/* Midnight wash behind the photo so slow networks degrade gracefully. */}
              <View style={styles.slideFallback} />
              <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
              <View style={styles.slideShade} />
              <View style={styles.slideCopy}>
                <Text style={styles.slideKicker}>{item.kicker}</Text>
                <Text style={styles.slideTitle}>{item.title}</Text>
              </View>
            </View>
          )}
        />
        <View style={styles.dots}>
          {HEROES.map((s, i) => (
            <Pressable
              key={s.id}
              hitSlop={8}
              onPress={() => {
                setSlide(i);
                pager.current?.scrollToIndex({ index: i, animated: true });
              }}>
              <View style={[styles.dot, i === slide && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* 3 ── Quick actions: the four core destinations, thumb-reachable. */}
        <Text style={styles.section}>Quick actions</Text>
        <View style={styles.grid}>
          {actions.map(({ label, Icon, to }) => (
            <Pressable
              key={label}
              onPress={() => router.push(to as never)}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
              <View style={styles.actionIcon}>
                <Icon />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 4 ── Academic calendar: exactly where the school is right now. */}
        <Text style={styles.section}>Academic calendar</Text>
        {week ? (
        <Pressable onPress={() => router.push('/(student)/calendar' as never)} style={styles.calCard}>
          <View style={styles.calRow}>
            <View>
              <Text style={styles.calWeek}>
                Week {week.weekNumber} of {week.totalWeeks}
              </Text>
              <Text style={styles.calMeta}>
                {semester ? `${semester} Semester` : ''}{sessionYear ? ` · ${sessionYear}` : ''}
              </Text>
            </View>
            <View style={styles.calPct}>
              <Text style={styles.calPctText}>{weekPct}%</Text>
            </View>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${weekPct}%` }]} />
          </View>
          {!!week.note && <Text style={styles.calNote}>{week.note}</Text>}
        </Pressable>
        ) : (
          <Text style={styles.date}>School calendar is being set up. Check back soon.</Text>
        )}

        {/* 5 ── Schedule: today merged — CR posts + personal tasks, time-ordered. */}
        <View style={styles.schedHead}>
          <Text style={styles.section}>Schedule</Text>
          <Pressable onPress={() => router.push('/(student)/calendar' as never)} hitSlop={8}>
            <Text style={styles.link}>Full calendar</Text>
          </Pressable>
        </View>
        {sessionStatus === 'loading' ? (
          <RowListSkeleton count={3} leading={40} />
        ) : (
          schedule.length === 0 && (
            <EmptyState title="A clear day" body="Nothing scheduled. Enjoy it, or get ahead on tomorrow." />
          )
        )}
        {schedule.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              item.kind === 'post' && item.postId
                ? router.push(`/(student)/post/${item.postId}` as never)
                : router.push('/(student)/itinerary' as never)
            }
            style={styles.slot}>
            <Text style={styles.slotTime}>{item.time}</Text>
            <View style={styles.slotLine}>
              <View style={[styles.slotDot, item.kind === 'task' && styles.slotDotTask]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotTitle}>{item.title}</Text>
              <Text style={styles.slotMeta}>{item.meta}</Text>
            </View>
          </Pressable>
        ))}

        {/* 6 ── Catch-up tail: the two freshest CR posts. */}
        <Text style={styles.section}>Latest updates</Text>
        {postsStatus === 'loading' && latest.length === 0 ? (
          <PostListSkeleton count={2} />
        ) : (
          latest.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/(student)/post/${p.id}` as never)} style={styles.post}>
            <Text style={styles.postCode}>{p.courseCode}</Text>
            <Text style={styles.postTitle}>{p.title}</Text>
            <Text style={styles.postMeta}>
              {p.author} · {formatDateTime(p.createdAt)}
            </Text>
          </Pressable>
          ))
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  body: { padding: theme.spacing.md, paddingBottom: theme.layout.tabClearance },

  // 1 ── greeting
  hello: { ...theme.type.hero, color: theme.colors.text },
  date: { ...theme.type.body, color: theme.colors.secondary, marginBottom: 16 },

  // Inline warning banner for a failed session load
  warn: {
    backgroundColor: 'rgba(210,31,60,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(210,31,60,0.22)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  warnText: { ...theme.type.body, color: theme.colors.danger },

  // 2 ── carousel (fixed height keeps layout stable while photos load)
  slide: {
    width: CARD_W,
    height: 180,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
  },
  slideFallback: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.primary },
  slideImage: { ...StyleSheet.absoluteFill },
  slideShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,19,48,0.55)' },
  slideCopy: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  slideKicker: {
    color: theme.colors.onPrimary,
    opacity: 0.85,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: theme.font.bold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  slideTitle: { color: theme.colors.onPrimary, fontSize: 17, fontWeight: '700', fontFamily: theme.font.bold, lineHeight: 23 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { width: 28, backgroundColor: theme.colors.primary },

  // 3 ── actions
  section: { ...theme.type.title, color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    ...theme.shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.text },

  // 4 ── academic calendar (midnight hero — the school's heartbeat)
  calCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calWeek: { color: theme.colors.onPrimary, fontSize: 22, fontWeight: '700', fontFamily: theme.font.bold, fontVariant: ['tabular-nums'] },
  calMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: theme.font.regular },
  calPct: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  calPctText: { color: theme.colors.onPrimary, fontWeight: '700', fontFamily: theme.font.bold, fontVariant: ['tabular-nums'] },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.onPrimary },
  calNote: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: theme.font.regular, marginTop: 8 },

  // 5 ── schedule timeline
  schedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  link: { color: theme.colors.accent, fontWeight: '700', fontFamily: theme.font.bold, fontSize: 13, marginBottom: 8 },
  slot: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  slotTime: {
    width: 52,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: theme.font.bold,
    color: theme.colors.accent,
    fontVariant: ['tabular-nums'],
    paddingTop: 2,
  },
  slotLine: { width: 20, alignItems: 'center', paddingTop: 6 },
  slotDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  slotDotTask: { backgroundColor: theme.colors.primaryMuted },
  slotTitle: { ...theme.type.body, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.text },
  slotMeta: { ...theme.type.caption, color: theme.colors.secondary },

  // 6 ── catch-up posts
  post: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 8,
    ...theme.shadow.card,
  },
  postCode: { fontSize: 13, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.accent, marginBottom: 2 },
  postTitle: { ...theme.type.body, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.text, marginBottom: 2 },
  postMeta: { ...theme.type.caption, color: theme.colors.secondary },
}));

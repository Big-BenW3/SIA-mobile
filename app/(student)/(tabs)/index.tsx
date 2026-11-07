import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  CalendarIcon,
  ChevronIcon,
  FolderIcon,
  GaugeIcon,
  PlusIcon,
} from "@/components/shared/Icons";
import { EmptyState } from "@/components/shared/States";
import {
  RowListSkeleton,
  PostListSkeleton,
} from "@/components/shared/Skeleton";
import { Button } from "@/components/shared/Button";
import { PressableScale } from "@/components/shared/PressableScale";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { NotificationPrimer } from "@/components/shared/NotificationPrimer";
import { PostCard } from "@/components/post/PostCard";
import { useAuthStore } from "@/stores/authStore";
import { usePostsStore } from "@/stores/postsStore";
import { usePlannerStore } from "@/stores/plannerStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useNotificationStore } from "@/stores/appStores";
import { dueTone, formatDue } from "@/utils/due";
import { formatDay } from "@/utils/dates";
import { themedStyles } from "@/components/themedStyles";

// ─── Home dashboard ─────────────────────────────────────────────────
// Order is deliberate: the one thing due next → shortcuts → where the
// semester is → everything coming up → catch-up. The most useful fact on the
// screen is the first card, not a photo.

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACTIONS = [
  { label: "Calendar", Icon: CalendarIcon, to: "/(student)/calendar" },
  { label: "New task", Icon: PlusIcon, to: "/(student)/itinerary/add" },
  { label: "Files", Icon: FolderIcon, to: "/(student)/resources" },
  { label: "CGPA", Icon: GaugeIcon, to: "/(student)/cgpa/overview" },
];

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const firstName = (user?.fullName ?? "there").split(" ")[0];

  const {
    week,
    semester,
    sessionYear,
    status: sessionStatus,
    error: sessionError,
    levelId,
    load: loadSession,
  } = useSessionStore();
  const weekPct = week
    ? Math.round((week.weekNumber / week.totalWeeks) * 100)
    : 0;

  const { posts, status: postsStatus, load: loadPosts } = usePostsStore();
  const { tasks } = usePlannerStore();
  const loadNotifications = useNotificationStore((s) => s.load);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSession();
      await Promise.all([
        loadPosts(useSessionStore.getState().levelId ?? levelId ?? undefined),
        loadNotifications(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadSession, loadPosts, loadNotifications, levelId]);

  // The soonest deadline that has not passed.
  const next = useMemo(
    () =>
      posts
        .filter((p) => p.dueDate && dueTone(p.dueDate) !== "past")
        .filter((p) => !Number.isNaN(new Date(p.dueDate as string).getTime()))
        .sort(
          (a, b) =>
            new Date(a.dueDate as string).getTime() -
            new Date(b.dueDate as string).getTime(),
        )[0],
    [posts],
  );

  // Schedule: nearest dated posts + open personal tasks, merged.
  const schedule = [
    ...posts
      .filter(
        (p) =>
          p.dueDate && !Number.isNaN(new Date(p.dueDate as string).getTime()),
      )
      .slice(0, 2)
      .map((p) => ({
        id: `post-${p.id}`,
        time: new Date(p.dueDate as string).toLocaleDateString(undefined, {
          weekday: "short",
        }),
        title: p.title,
        meta: `${p.courseCode ?? ""} · ${formatDue(p.dueDate) ?? ""}`.trim(),
        kind: "post" as const,
        postId: p.id,
      })),
    ...tasks
      .filter((t) => t.status === "pending")
      .slice(0, 3)
      .map((t) => ({
        id: `task-${t.id}`,
        time: t.scheduledDate ? formatDay(t.scheduledDate) : "Anytime",
        title: t.title,
        meta: `My task · ${t.difficulty}`,
        kind: "task" as const,
        postId: undefined,
      })),
  ];

  const latest = posts.slice(0, 3);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <AppHeader title="Home" />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* 1 ── Greeting */}
        <Reveal index={0}>
          <Text style={styles.hello}>
            {greeting()}, {firstName}
          </Text>
          <Text style={styles.sub}>Here is your level at a glance.</Text>
        </Reveal>

        <NotificationPrimer />

        {/* A failed session load is explained, not silently rendered as zeros. */}
        {sessionStatus === "error" && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              {sessionError || "Could not reach your level right now."}
            </Text>
            <Button
              title="Retry"
              variant="secondary"
              onPress={loadSession}
              style={{ marginTop: theme.spacing.xs }}
            />
          </View>
        )}

        {/* 2 ── Up next: the single most useful card. */}
        <Reveal index={1}>
          {next ? (
            <PressableScale
              onPress={() => router.push(`/(student)/post/${next.id}` as never)}
              style={styles.upNext}
              accessibilityRole="button"
              accessibilityLabel={`Up next: ${next.title}, ${formatDue(next.dueDate)}`}
            >
              <Text style={styles.kicker}>UP NEXT</Text>
              <Text style={styles.upNextTitle} numberOfLines={2}>
                {next.title}
              </Text>
              <View style={styles.upNextFoot}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upNextMeta}>
                    {next.courseCode} · {next.postType}
                  </Text>
                  <Text style={styles.countdown}>
                    {formatDue(next.dueDate)}
                  </Text>
                </View>
                <ChevronIcon color={theme.colors.onPrimary} size={22} />
              </View>
            </PressableScale>
          ) : (
            <View style={styles.clear}>
              <Text style={styles.clearTitle}>Nothing due soon</Text>
              <Text style={styles.clearBody}>
                New deadlines from your CR will show up here.
              </Text>
            </View>
          )}
        </Reveal>

        {/* 3 ── Quick actions */}
        <Reveal index={2} style={styles.grid}>
          {ACTIONS.map(({ label, Icon, to }) => (
            <PressableScale
              key={label}
              onPress={() => router.push(to as never)}
              style={styles.action}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <View style={styles.actionIcon}>
                <Icon />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </PressableScale>
          ))}
        </Reveal>

        {/* 4 ── Academic week */}
        <Reveal index={3}>
          <SectionHeader title="Academic calendar" />
          {week ? (
            <PressableScale
              onPress={() => router.push("/(student)/calendar" as never)}
              style={styles.weekCard}
              accessibilityRole="button"
              accessibilityLabel={`Week ${week.weekNumber} of ${week.totalWeeks}. Open calendar.`}
            >
              <View style={styles.weekRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weekTitle}>
                    Week {week.weekNumber} of {week.totalWeeks}
                  </Text>
                  <Text style={styles.weekMeta}>
                    {semester ? `${semester} Semester` : ""}
                    {sessionYear ? ` · ${sessionYear}` : ""}
                  </Text>
                </View>
                <View style={styles.pct}>
                  <Text style={styles.pctText}>{weekPct}%</Text>
                </View>
              </View>
              <ProgressBar value={weekPct} label="Semester progress" />
              {!!week.note && <Text style={styles.weekNote}>{week.note}</Text>}
            </PressableScale>
          ) : (
            <Text style={styles.sub}>
              School calendar is being set up. Check back soon.
            </Text>
          )}
        </Reveal>

        {/* 5 ── Schedule */}
        <Reveal index={4}>
          <SectionHeader
            title="Schedule"
            actionLabel="Full calendar"
            onAction={() => router.push("/(student)/calendar" as never)}
          />
          {sessionStatus === "loading" ? (
            <RowListSkeleton count={3} leading={40} />
          ) : schedule.length === 0 ? (
            <EmptyState
              pose="sleep"
              title="A clear day"
              body="Nothing scheduled. Enjoy it, or get ahead on tomorrow."
            />
          ) : (
            schedule.map((item, i) => (
              <PressableScale
                key={item.id}
                onPress={() =>
                  item.kind === "post" && item.postId
                    ? router.push(`/(student)/post/${item.postId}` as never)
                    : router.push("/(student)/itinerary" as never)
                }
                style={[styles.slot, i > 0 && styles.slotDivider]}
                accessibilityRole="button"
              >
                <Text style={styles.slotTime}>{item.time}</Text>
                <View style={styles.slotLine}>
                  <View
                    style={[
                      styles.slotDot,
                      item.kind === "task" && styles.slotDotTask,
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.slotMeta}>{item.meta}</Text>
                </View>
              </PressableScale>
            ))
          )}
        </Reveal>

        {/* 6 ── Catch-up */}
        <Reveal index={5}>
          <SectionHeader
            title="Latest updates"
            actionLabel="See all"
            onAction={() => router.push("/(student)/updates" as never)}
          />
          {postsStatus === "loading" && latest.length === 0 ? (
            <PostListSkeleton count={2} />
          ) : latest.length === 0 ? (
            <EmptyState
              pose="read"
              title="No updates yet"
              body="Posts from your CRs will appear here."
            />
          ) : (
            latest.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onPress={() => router.push(`/(student)/post/${p.id}` as never)}
              />
            ))
          )}
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    body: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance,
    },

    hello: { ...theme.type.hero, color: theme.colors.text },
    sub: {
      ...theme.type.body,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.md,
    },

    warn: {
      backgroundColor: theme.colors.dangerTint,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    warnText: { ...theme.type.body, color: theme.colors.danger },

    // up next (the one ink card on the screen)
    upNext: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
      ...theme.shadow.card,
    },
    kicker: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.colors.gold,
    },
    upNextTitle: { ...theme.type.hero, color: theme.colors.onPrimary },
    upNextFoot: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.xs,
    },
    upNextMeta: {
      ...theme.type.caption,
      color: theme.colors.onPrimaryMid,
      textTransform: "capitalize",
    },
    countdown: {
      ...theme.type.mono,
      color: theme.colors.onPrimary,
      fontSize: 18,
    },
    clear: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      gap: 4,
    },
    clearTitle: { ...theme.type.title, color: theme.colors.text },
    clearBody: { ...theme.type.body, color: theme.colors.secondary },

    // quick actions
    grid: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    action: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.sm,
      alignItems: "center",
      gap: theme.spacing.xs,
      ...theme.shadow.card,
    },
    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },

    // academic week (light card: only one ink card per screen)
    weekCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      ...theme.shadow.card,
    },
    weekRow: { flexDirection: "row", alignItems: "center" },
    weekTitle: {
      ...theme.type.title,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    weekMeta: { ...theme.type.caption, color: theme.colors.secondary },
    pct: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    pctText: { ...theme.type.mono, color: theme.colors.text },
    weekNote: { ...theme.type.caption, color: theme.colors.secondary },

    // schedule
    slot: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: theme.spacing.sm,
    },
    slotDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    slotTime: {
      width: 76,
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
      fontVariant: ["tabular-nums"],
      paddingTop: 2,
    },
    slotLine: { width: 20, alignItems: "center", paddingTop: 6 },
    slotDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    slotDotTask: { backgroundColor: theme.colors.primaryMuted },
    slotTitle: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    slotMeta: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

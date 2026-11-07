import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { BackIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { usePostsStore } from "@/stores/postsStore";
import { usePlannerStore } from "@/stores/plannerStore";
import { useSessionStore } from "@/stores/sessionStore";
import { formatDue } from "@/utils/due";
import { themedStyles } from "@/components/themedStyles";

// ─── CalendarBody (shared, both roles) ──────────────────────────────
// Real dates throughout. Daily = the week around the selected day plus that
// day's agenda; Semester = a month grid you can page through. Dots mark what a
// day holds: gold = school event, ink = CR deadline, grey = your own task.
// Personal tasks pin to their day when `scheduledDate` is an ISO day; older
// free-text/blank dates list under "Undated". `base` scopes drill-down routes.

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MODES = ["Daily", "Semester"] as const;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeekMonday(now: Date): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Same key shape as `dayKey`, for a plain "YYYY-MM-DD" task date. */
function taskDayKey(value: string | null | undefined): string | null {
  const m = value ? ISO_DAY.exec(value) : null;
  return m ? `${Number(m[1])}-${Number(m[2]) - 1}-${Number(m[3])}` : null;
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function push<T>(map: Map<string, T[]>, key: string, item: T) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

export function CalendarBody({ base }: { base: "(student)" | "(cr)" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { posts } = usePostsStore();
  const { tasks } = usePlannerStore();
  const session = useSessionStore();

  const [mode, setMode] = useState<(typeof MODES)[number]>("Daily");
  const progress = useSharedValue(0);
  const [selDate, setSelDate] = useState<Date>(() => startOfDay(new Date()));
  const [view, setView] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const todayKey = dayKey(new Date());
  const selKey = dayKey(selDate);

  const switchMode = (i: number) => {
    setMode(MODES[i]);
    progress.set(
      reduce
        ? i
        : withTiming(i, { duration: duration.small, easing: ease.out }),
    );
  };

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(selDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selDate]);

  const dueMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; title: string; courseCode: string; dueDate: string }[]
    >();
    for (const p of posts) {
      const d = parseDate(p.dueDate);
      if (!d) continue;
      push(map, dayKey(d), {
        id: p.id,
        title: p.title,
        courseCode: p.courseCode ?? "",
        dueDate: p.dueDate as string,
      });
    }
    return map;
  }, [posts]);

  const eventMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; title: string; description: string | null }[]
    >();
    for (const e of session.events) {
      const d = parseDate(e.eventDate);
      if (!d) continue;
      push(map, dayKey(d), {
        id: e.id,
        title: e.title,
        description: e.description,
      });
    }
    return map;
  }, [session.events]);

  // Open tasks: pinned to a day when the date is ISO, otherwise "undated".
  const { taskMap, undated } = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    const loose: typeof tasks = [];
    for (const t of tasks) {
      if (t.status !== "pending") continue;
      const k = taskDayKey(t.scheduledDate);
      if (k) push(map, k, t);
      else loose.push(t);
    }
    return { taskMap: map, undated: loose };
  }, [tasks]);

  const markers = (k: string) => ({
    event: eventMap.has(k),
    due: dueMap.has(k),
    task: taskMap.has(k),
  });

  if (session.status === "loading") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Calendar" showBack />
        <LoadingState variant="calendar" message="Loading your calendar…" />
      </SafeAreaView>
    );
  }

  if (session.status === "error") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Calendar" showBack />
        <ErrorState
          message={session.error}
          actionLabel="Retry"
          onAction={() => session.load()}
        />
      </SafeAreaView>
    );
  }

  const dayEvents = eventMap.get(selKey) ?? [];
  const dayPosts = dueMap.get(selKey) ?? [];
  const dayTasks = taskMap.get(selKey) ?? [];
  const nothingOnDay =
    dayEvents.length + dayPosts.length + dayTasks.length === 0;

  // Month grid, padded to whole weeks so every row has exactly seven cells.
  const first = new Date(view.year, view.month, 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) =>
    cells.slice(r * 7, r * 7 + 7),
  );

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () => {
    const t = startOfDay(new Date());
    setSelDate(t);
    setView({ year: t.getFullYear(), month: t.getMonth() });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Calendar" showBack />
      <View style={styles.toggle}>
        <SegmentedControl
          labels={MODES}
          progress={progress}
          onPress={switchMode}
        />
      </View>

      {mode === "Daily" ? (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Reveal index={0}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
              accessibilityRole="tablist"
            >
              {weekDays.map((d) => {
                const k = dayKey(d);
                const active = k === selKey;
                const isToday = k === todayKey;
                return (
                  <PressableScale
                    key={k}
                    onPress={() => setSelDate(d)}
                    haptic="selection"
                    style={[
                      styles.day,
                      isToday && !active && styles.dayToday,
                      active && styles.dayActive,
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={d.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  >
                    <Text style={[styles.dayName, active && styles.onInk]}>
                      {DAY_NAMES[(d.getDay() + 6) % 7]}
                    </Text>
                    <Text style={[styles.dayNum, active && styles.onInk]}>
                      {d.getDate()}
                    </Text>
                    <Dots marks={markers(k)} onInk={active} />
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Reveal>

          <Reveal index={1}>
            <View style={styles.dateRow}>
              <Text style={styles.date} accessibilityRole="header">
                {selDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              {selKey !== todayKey && (
                <PressableScale
                  onPress={goToday}
                  hitSlop={8}
                  style={styles.todayBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Jump to today"
                >
                  <Text style={styles.todayBtnText}>Today</Text>
                </PressableScale>
              )}
            </View>
          </Reveal>

          <Reveal index={2}>
            {nothingOnDay && (
              <View style={styles.emptyWrap}>
                <EmptyState
                  pose="sleep"
                  title="A clear day"
                  body="No deadlines or events on this day. Enjoy it, or get ahead."
                />
              </View>
            )}

            {dayEvents.map((e) => (
              <AgendaCard
                key={e.id}
                tone={theme.colors.gold}
                kind="School event"
                title={e.title}
                meta={e.description}
              />
            ))}
            {dayPosts.map((p) => (
              <AgendaCard
                key={p.id}
                tone={theme.colors.primary}
                kind={`Deadline${p.courseCode ? ` · ${p.courseCode}` : ""}`}
                title={p.title}
                meta={formatDue(p.dueDate)}
                onPress={() => router.push(`${base}/post/${p.id}` as never)}
              />
            ))}
            {dayTasks.map((t) => (
              <AgendaCard
                key={t.id}
                tone={theme.colors.primaryMuted}
                kind={`My task · ${t.difficulty}`}
                title={t.title}
                onPress={() =>
                  router.push(`${base}/itinerary/${t.id}` as never)
                }
              />
            ))}

            {undated.length > 0 && (
              <>
                <SectionHeader title="Undated" />
                {undated.map((t) => (
                  <AgendaCard
                    key={t.id}
                    tone={theme.colors.primaryMuted}
                    kind={`My task · ${t.difficulty}`}
                    title={t.title}
                    meta={t.scheduledDate ? t.scheduledDate : "No date set"}
                    onPress={() =>
                      router.push(`${base}/itinerary/${t.id}` as never)
                    }
                  />
                ))}
              </>
            )}
          </Reveal>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Reveal index={0}>
            <View style={styles.monthCard}>
              <View style={styles.monthHead}>
                <PressableScale
                  onPress={() => shiftMonth(-1)}
                  haptic="selection"
                  style={styles.nav}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <BackIcon />
                </PressableScale>
                <Text style={styles.monthTitle} accessibilityRole="header">
                  {MONTH_NAMES[view.month]} {view.year}
                </Text>
                <PressableScale
                  onPress={() => shiftMonth(1)}
                  haptic="selection"
                  style={styles.nav}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <View style={styles.flip}>
                    <BackIcon />
                  </View>
                </PressableScale>
              </View>

              <View style={styles.weekRow}>
                {DAY_NAMES.map((w) => (
                  <Text key={w} style={styles.weekDay}>
                    {w}
                  </Text>
                ))}
              </View>

              {rows.map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((d, c) => {
                    if (d === null) return <View key={c} style={styles.cell} />;
                    const date = new Date(view.year, view.month, d);
                    const k = dayKey(date);
                    const sel = k === selKey;
                    const isToday = k === todayKey;
                    return (
                      <View key={c} style={styles.cell}>
                        <PressableScale
                          onPress={() => {
                            setSelDate(date);
                            switchMode(0);
                          }}
                          haptic="selection"
                          style={[
                            styles.cellInner,
                            isToday && !sel && styles.cellToday,
                            sel && styles.cellSel,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: sel }}
                          accessibilityLabel={date.toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        >
                          <Text style={[styles.cellText, sel && styles.onInk]}>
                            {d}
                          </Text>
                          <Dots marks={markers(k)} onInk={sel} />
                        </PressableScale>
                      </View>
                    );
                  })}
                </View>
              ))}

              <View style={styles.legend}>
                <Legend color={theme.colors.gold} label="Event" />
                <Legend color={theme.colors.primary} label="Deadline" />
                <Legend color={theme.colors.primaryMuted} label="My task" />
              </View>
            </View>
          </Reveal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Dots({
  marks,
  onInk,
}: {
  marks: { event: boolean; due: boolean; task: boolean };
  onInk?: boolean;
}) {
  return (
    <View style={styles.dots}>
      {marks.event && (
        <View style={[styles.dot, { backgroundColor: theme.colors.gold }]} />
      )}
      {marks.due && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: onInk
                ? theme.colors.onPrimary
                : theme.colors.primary,
            },
          ]}
        />
      )}
      {marks.task && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: onInk
                ? theme.colors.onPrimaryMid
                : theme.colors.primaryMuted,
            },
          ]}
        />
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function AgendaCard({
  tone,
  kind,
  title,
  meta,
  onPress,
}: {
  tone: string;
  kind: string;
  title: string;
  meta?: string | null;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.bar, { backgroundColor: tone }]} />
      <View style={styles.cardBody}>
        <Text style={styles.kind}>{kind}</Text>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
      </View>
    </>
  );
  return onPress ? (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${kind}: ${title}`}
    >
      {content}
    </PressableScale>
  ) : (
    <View style={styles.card}>{content}</View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    toggle: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
    },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
    onInk: { color: theme.colors.onPrimary },

    strip: { gap: theme.spacing.xs, paddingBottom: theme.spacing.sm },
    day: {
      width: 56,
      minHeight: 76,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    dayToday: { borderColor: theme.colors.primary },
    dayActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    dayName: { ...theme.type.caption, color: theme.colors.secondary },
    dayNum: {
      ...theme.type.title,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    dots: { flexDirection: "row", gap: 3, height: 6, alignItems: "center" },
    dot: { width: 6, height: 6, borderRadius: 3 },

    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    date: { ...theme.type.title, color: theme.colors.text, flex: 1 },
    todayBtn: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.softBlue,
    },
    todayBtnText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    emptyWrap: { minHeight: 240 },

    card: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.xs,
      overflow: "hidden",
      ...theme.shadow.card,
    },
    bar: { width: 4 },
    cardBody: { flex: 1, padding: theme.spacing.md, gap: 2 },
    kind: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    itemTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    meta: { ...theme.type.caption, color: theme.colors.secondary },

    monthCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.sm,
      ...theme.shadow.card,
    },
    monthHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    nav: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    flip: { transform: [{ scaleX: -1 }] },
    monthTitle: { ...theme.type.title, color: theme.colors.text },
    weekRow: { flexDirection: "row", marginBottom: theme.spacing.xs },
    weekDay: {
      flex: 1,
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.secondary,
      textAlign: "center",
    },
    gridRow: { flexDirection: "row" },
    cell: {
      flex: 1,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    cellInner: {
      width: 40,
      height: 48,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    cellToday: { borderWidth: 1, borderColor: theme.colors.primary },
    cellSel: { backgroundColor: theme.colors.primary },
    cellText: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    legend: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendText: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

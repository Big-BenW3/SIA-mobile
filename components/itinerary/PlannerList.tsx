import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import {
  EmptyState,
  ErrorState,
  SuccessBanner,
} from "@/components/shared/States";
import { DifficultyDot } from "@/components/shared/Chips";
import { AddIcon, SparklesIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { useDockTop } from "@/components/shared/Dock";
import { MascotLoader } from "@/components/mascot/MascotLoader";
import { TaskCheck } from "./TaskCheck";
import {
  orderTasks,
  usePlannerStore,
  type ArrangeResult,
} from "@/stores/plannerStore";
import { formatDay, isOverdueDay } from "@/utils/dates";
import { themedStyles } from "@/components/themedStyles";

// ─── PlannerList (shared, both roles) ───────────────────────────────
// The personal task list, driven by `plannerStore` so checks, adds and
// deletes persist across screens. `base` scopes navigation to the
// caller's group: the student tab passes '(student)', the CR merged
// Post|Plan page passes '(cr)'. No chrome here — parents own headers.
//
// Smart arrange asks the server to rank the open tasks and set difficulty.
// The result banner reports what ACTUALLY changed — never a made-up claim.

type Phase =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; result: ArrangeResult }
  | { kind: "error"; message: string };

function summarise(r: ArrangeResult): string {
  if (r.ranked === 0)
    return "Couldn't rank these yet. Your tasks haven't synced; check your connection and try again.";
  if (r.moved === 0 && r.reclassified === 0)
    return `Already in a good order. ${r.ranked} task${r.ranked === 1 ? "" : "s"} checked, nothing changed.`;
  const parts = [`Arranged ${r.ranked} task${r.ranked === 1 ? "" : "s"}`];
  if (r.moved) parts.push(`${r.moved} moved`);
  if (r.reclassified)
    parts.push(
      `${r.reclassified} difficulty ${r.reclassified === 1 ? "change" : "changes"}`,
    );
  if (r.skipped) parts.push(`${r.skipped} not synced`);
  return parts.join(" · ");
}

export function PlannerList({ base }: { base: "(student)" | "(cr)" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const dockTop = useDockTop();
  const { tasks, order, toggleDone, arrangeViaServer } = usePlannerStore();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [celebrate, setCelebrate] = useState(false);

  const ordered = useMemo(() => orderTasks(tasks, order), [tasks, order]);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const openCount = tasks.length - doneCount;

  // Success notes clear themselves; they confirm something, they don't linger.
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 2000);
    return () => clearTimeout(t);
  }, [celebrate]);
  useEffect(() => {
    if (phase.kind !== "done") return;
    const t = setTimeout(() => setPhase({ kind: "idle" }), 6000);
    return () => clearTimeout(t);
  }, [phase]);

  const toggle = (id: string, done: boolean) => {
    toggleDone(id);
    if (!done) setCelebrate(true);
  };

  const arrange = useCallback(async () => {
    setPhase({ kind: "busy" });
    try {
      const result = await arrangeViaServer();
      setPhase({ kind: "done", result });
    } catch {
      setPhase({
        kind: "error",
        message: "Couldn't reach the arranger. Your tasks are unchanged.",
      });
    }
  }, [arrangeViaServer]);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyCenter}>
        <EmptyState
          pose="idle"
          title="Nothing planned yet"
          body="Add your first task. Once you have a few, Stax can arrange them for you."
          actionLabel="Add your first task"
          onAction={() => router.push(`${base}/itinerary/add` as never)}
        />
      </View>
    );
  }

  const header = (
    <View style={styles.head}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {doneCount} of {tasks.length} done
        </Text>
        <Text style={styles.progressPct}>
          {Math.round((doneCount / tasks.length) * 100)}%
        </Text>
      </View>
      <ProgressBar
        value={(doneCount / tasks.length) * 100}
        tone="ink"
        label="Tasks completed"
      />

      {celebrate && <SuccessBanner message="Nice, one less thing to carry." />}

      {phase.kind === "busy" ? (
        <View style={styles.arranging}>
          <MascotLoader
            pose="think"
            size={72}
            message="Arranging your tasks…"
          />
        </View>
      ) : (
        <>
          {openCount >= 2 && (
            <PressableScale
              onPress={arrange}
              haptic="light"
              style={styles.arrange}
              accessibilityRole="button"
              accessibilityLabel="Smart arrange my open tasks"
            >
              <View style={styles.arrangeIcon}>
                <SparklesIcon color={theme.colors.goldDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.arrangeTitle}>Smart arrange</Text>
                <Text style={styles.arrangeBody}>
                  Orders your open tasks and sets their difficulty.
                </Text>
              </View>
            </PressableScale>
          )}
          {phase.kind === "done" && (
            <SuccessBanner message={summarise(phase.result)} />
          )}
          {phase.kind === "error" && (
            <ErrorState
              title="Arrange failed"
              message={phase.message}
              actionLabel="Try again"
              onAction={arrange}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Animated.FlatList
        data={ordered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        itemLayoutAnimation={
          reduce
            ? undefined
            : LinearTransition.duration(duration.enter).easing(ease.out)
        }
        renderItem={({ item }) => {
          const isDone = item.status === "done";
          const overdue = !isDone && isOverdueDay(item.scheduledDate);
          const rank = !isDone ? order[item.id] : undefined;
          return (
            <PressableScale
              onPress={() =>
                router.push(`${base}/itinerary/${item.id}` as never)
              }
              style={[styles.row, isDone && styles.rowDone]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.difficulty}${isDone ? ", done" : ""}`}
            >
              <TaskCheck
                done={isDone}
                onToggle={() => toggle(item.id, isDone)}
                label={isDone ? "Mark not done" : "Mark done"}
              />
              <View style={styles.body}>
                <Text
                  style={[styles.title, isDone && styles.strike]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  <Text style={overdue && styles.overdue}>
                    {formatDay(item.scheduledDate)}
                  </Text>
                  {rank ? ` · Step ${rank}` : ""}
                </Text>
              </View>
              <DifficultyDot level={item.difficulty} />
            </PressableScale>
          );
        }}
      />
      <PressableScale
        onPress={() => router.push(`${base}/itinerary/add` as never)}
        haptic="light"
        style={[styles.fab, { bottom: dockTop + theme.spacing.md }]}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <AddIcon color={theme.colors.onPrimary} />
      </PressableScale>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { flex: 1 },
    emptyCenter: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
    },
    list: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance + 72,
    },
    head: { gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
    progressRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    progressText: { ...theme.type.title, color: theme.colors.text },
    progressPct: { ...theme.type.mono, color: theme.colors.secondary },

    arrange: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.goldTint,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
    },
    arrangeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    arrangeTitle: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    arrangeBody: { ...theme.type.caption, color: theme.colors.secondary },
    arranging: { paddingVertical: theme.spacing.md, alignItems: "center" },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
      minHeight: theme.layout.rowMinHeight,
      ...theme.shadow.card,
    },
    rowDone: { opacity: 0.6 },
    body: { flex: 1, gap: 2 },
    title: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    strike: { textDecorationLine: "line-through" },
    meta: { ...theme.type.caption, color: theme.colors.secondary },
    overdue: {
      color: theme.colors.danger,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
    fab: {
      position: "absolute",
      right: theme.spacing.md,
      width: 56,
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadow.card,
    },
  }),
);

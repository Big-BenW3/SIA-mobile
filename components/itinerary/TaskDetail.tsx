import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Screen";
import { DifficultyPicker } from "@/components/shared/DifficultyPicker";
import { ErrorState, SuccessBanner } from "@/components/shared/States";
import { usePlannerStore } from "@/stores/plannerStore";
import { formatDay } from "@/utils/dates";
import { confirmAction } from "@/utils/confirm";
import { themedStyles } from "@/components/themedStyles";

// ─── TaskDetail (shared, both roles) ────────────────────────────────
// Difficulty edits apply instantly (no navigating away mid-edit); completion
// and delete act on the store. Navigation is back()-only, so this body is
// group-agnostic.

export function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, updateTask, deleteTask } = usePlannerStore();
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title="Task" showBack />
        <ErrorState
          title="Task not found"
          message="This task may have been deleted."
          actionLabel="Back to planner"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const isDone = task.status === "done";

  const toggleDone = () => {
    updateTask(task.id, { status: isDone ? "pending" : "done" });
    setNote(isDone ? "Moved back to your open tasks." : "Marked complete.");
    if (!isDone) timer.current = setTimeout(() => router.back(), 700);
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: "Delete task?",
      message: "This removes it from your private planner.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    deleteTask(task.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Task" showBack />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={[styles.title, isDone && styles.strike]}>
            {task.title}
          </Text>
          <Text style={styles.meta}>
            {formatDay(task.scheduledDate)} · {isDone ? "Done" : "Open"}
          </Text>
        </Card>

        <DifficultyPicker
          value={task.difficulty}
          onChange={(d) => {
            if (d && d !== task.difficulty) {
              updateTask(task.id, { difficulty: d });
              setNote("Difficulty updated.");
            }
          }}
          label="Difficulty (tap to change)"
        />

        {note && <SuccessBanner message={note} />}

        <View style={styles.actions}>
          <Button
            title={isDone ? "Mark incomplete" : "Mark complete"}
            variant={isDone ? "secondary" : "primary"}
            onPress={toggleDone}
          />
          <Button title="Delete task" variant="danger" onPress={remove} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    body: { padding: theme.spacing.md, gap: theme.spacing.xs },
    title: { ...theme.type.title, color: theme.colors.text },
    strike: { textDecorationLine: "line-through", opacity: 0.6 },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: 4,
    },
    actions: { gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  }),
);

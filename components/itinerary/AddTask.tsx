import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { ErrorState, SuccessBanner } from "@/components/shared/States";
import { usePlannerStore } from "@/stores/plannerStore";
import type { Difficulty } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── AddTask (shared, both roles) ───────────────────────────────────
// Empty input errors inline instead of no-op'ing. Both save paths write
// to the store: AI-arrange suggests a difficulty first, plain save
// defaults to Medium. Navigation is back()-only, so group-agnostic.

export function AddTask() {
  const router = useRouter();
  const { addTask, updateTask, arrangeViaServer } = usePlannerStore();
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [ai, setAi] = useState<Difficulty | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // Arrange saves immediately; the id lets Save below refine, not duplicate.
  const [savedId, setSavedId] = useState<string | null>(null);

  // Local heuristic doubles as the offline fallback when the server
  // arrange endpoint is unreachable.
  const suggest = (t: string): Difficulty =>
    t.length > 60 ? "hard" : t.length > 25 ? "medium" : "easy";

  const arrange = async () => {
    if (!text.trim()) {
      setError("Describe the task first — AI needs something to arrange.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      // Save first so the server sees the full pending list, then apply
      // the returned arrangement and surface this task's suggestion.
      const id = addTask({
        title: text.trim(),
        difficulty: "medium",
        scheduledDate: date.trim() || null,
      });
      setSavedId(id);
      await arrangeViaServer();
      const latest = usePlannerStore.getState().tasks;
      const mine = latest.find((t) => t.id === id);
      setAi(mine?.difficulty ?? suggest(text));
      setSaved(true);
      setBusy(false);
      setTimeout(() => router.back(), 900);
    } catch {
      setBusy(false);
      setAi(suggest(text));
      setError(
        "Server arrange is unreachable — showing an on-device suggestion instead.",
      );
    }
  };

  const save = (difficulty: Difficulty) => {
    if (!text.trim()) {
      setError("Describe the task first.");
      return;
    }
    setError("");
    if (savedId) {
      // Arrange already saved it — just refine the difficulty.
      updateTask(savedId, { difficulty });
    } else {
      addTask({
        title: text.trim(),
        difficulty,
        scheduledDate: date.trim() || null,
      });
    }
    setSaved(true);
    setTimeout(() => router.back(), 800);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <AppHeader title="Add task" showBack />
      <ScrollView contentContainerStyle={styles.body}>
        <Field
          label="What do you need to do?"
          value={text}
          onChangeText={(t) => {
            setText(t);
            setAi(null);
            if (error) setError("");
          }}
          placeholder="e.g. Summarise chapter 4 and attempt 5 past questions…"
          multiline
        />
        <Field
          label="Scheduled date (optional)"
          value={date}
          onChangeText={setDate}
          placeholder="e.g. Friday"
        />
        {ai && (
          <SuccessBanner
            message={`AI suggests ${ai} — saved with that difficulty, editable anytime.`}
          />
        )}
        {saved && <SuccessBanner message="Task added to your planner." />}
        {!!error && <ErrorState title="Check this entry" message={error} />}
        <Button
          title={busy ? "Arranging…" : "Arrange with AI"}
          onPress={arrange}
        />
        <View style={{ height: 8 }} />
        <Button
          title={ai ? `Save with AI (${ai})` : "Save without AI (Medium)"}
          variant="secondary"
          onPress={() => save(ai ?? "medium")}
        />
        <Text style={styles.note}>
          AI never touches CR posts or grades — it only orders your private
          list.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    body: { padding: theme.spacing.md },
    note: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: 16,
    },
  }),
);

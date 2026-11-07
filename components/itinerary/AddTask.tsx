import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { SelectChip } from "@/components/shared/Chips";
import { DifficultyPicker } from "@/components/shared/DifficultyPicker";
import { SuccessBanner } from "@/components/shared/States";
import { usePlannerStore } from "@/stores/plannerStore";
import { dayChoices } from "@/utils/dates";
import type { Difficulty } from "@/types";
import { themedStyles } from "@/components/themedStyles";

// ─── AddTask (shared, both roles) ───────────────────────────────────
// Saves a personal task to the planner store. Navigation is back()-only,
// so group-agnostic. Date and difficulty are picked from fixed options, so
// nothing free-typed can end up stored as a date or a difficulty.

export function AddTask() {
  const router = useRouter();
  const { addTask } = usePlannerStore();
  const choices = useMemo(() => dayChoices(), []);
  const [text, setText] = useState("");
  const [dayKey, setDayKey] = useState("none");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const save = () => {
    if (saved) return;
    if (!text.trim()) {
      setError("Describe the task first.");
      return;
    }
    setError("");
    addTask({
      title: text.trim(),
      difficulty,
      scheduledDate: choices.find((c) => c.key === dayKey)?.value ?? null,
    });
    setSaved(true);
    timer.current = setTimeout(() => router.back(), 800);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Add task" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <Field
              label="What do you need to do?"
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (error) setError("");
              }}
              placeholder="e.g. Summarise chapter 4"
              hint="Be specific. A short action is easier to start and to arrange."
              multiline
              error={error || undefined}
              editable={!saved}
            />

            <View style={styles.group} accessibilityRole="radiogroup">
              <Text style={styles.label}>When</Text>
              <View style={styles.chips}>
                {choices.map((c) => (
                  <SelectChip
                    key={c.key}
                    label={c.label}
                    selected={dayKey === c.key}
                    onPress={() => setDayKey(c.key)}
                  />
                ))}
              </View>
            </View>

            <DifficultyPicker
              value={difficulty}
              onChange={(v) => v && setDifficulty(v)}
            />

            {saved && <SuccessBanner message="Task added to your planner." />}
            <Button
              title={saved ? "Added" : "Save task"}
              onPress={save}
              disabled={saved}
            />
            <Text style={styles.note}>
              Tasks are private to you. CRs never see them.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    flex: { flex: 1 },
    body: { padding: theme.spacing.md, flexGrow: 1, alignItems: "center" },
    column: { width: "100%", maxWidth: 480, gap: theme.spacing.xs },
    group: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
    note: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },
  }),
);

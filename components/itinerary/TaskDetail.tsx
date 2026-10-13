import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Screen';
import { ErrorState, SuccessBanner } from '@/components/shared/States';
import { usePlannerStore } from '@/stores/plannerStore';
import type { Difficulty } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── TaskDetail (shared, both roles) ────────────────────────────────
// Difficulty edits, completion and delete all act on the store.
// Navigation is back()-only, so this body is group-agnostic.

export function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, updateTask, deleteTask } = usePlannerStore();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
        <AppHeader title="Task" showBack />
        <ErrorState title="Task not found" message="This task may have been deleted." actionLabel="Back to planner" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  const save = (patch: Partial<Pick<typeof task, 'difficulty' | 'status'>>) => {
    // SQLite writes are synchronous — no fake latency, just save and go.
    updateTask(task.id, patch);
    setSaved(true);
    setBusy(false);
    setTimeout(() => router.back(), 700);
  };

  const remove = () =>
    Alert.alert('Delete task?', 'This removes it from your private planner.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
      <AppHeader title="Task" showBack />
      <View style={styles.body}>
        <Card>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.meta}>{task.scheduledDate} · {task.status}</Text>
        </Card>
        <Text style={styles.label}>Difficulty (tap to change)</Text>
        <View style={styles.row}>
          {(['easy', 'medium', 'hard'] as const).map((d: Difficulty) => (
            <Pressable key={d} onPress={() => save({ difficulty: d })} style={[styles.pill, task.difficulty === d && styles.pillActive]}>
              <Text style={[styles.pillText, task.difficulty === d && { color: theme.colors.onPrimary }]}>{d}</Text>
            </Pressable>
          ))}
        </View>
        {saved && <SuccessBanner message="Saved to your planner." />}
        <Button
          title={busy ? 'Saving…' : task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
          variant="secondary"
          onPress={() => save({ status: task.status === 'done' ? 'pending' : 'done' })}
        />
        <View style={{ height: 8 }} />
        <Button title="Delete task" variant="danger" onPress={remove} />
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  body: { padding: theme.spacing.md },
  title: { ...theme.type.title, color: theme.colors.text },
  meta: { ...theme.type.caption, color: theme.colors.secondary, marginTop: 4 },
  label: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { flex: 1, minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { fontFamily: theme.font.bold, fontWeight: '700', textTransform: 'capitalize', color: theme.colors.text },
}));

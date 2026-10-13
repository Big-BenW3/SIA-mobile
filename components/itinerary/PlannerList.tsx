import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { EmptyState, SuccessBanner } from '@/components/shared/States';
import { usePlannerStore } from '@/stores/plannerStore';
import { themedStyles } from '@/components/themedStyles';

// ─── PlannerList (shared, both roles) ───────────────────────────────
// The personal task list, driven by `plannerStore` so checks, adds and
// deletes persist across screens. `base` scopes navigation to the
// caller's group: the student tab passes '(student)', the CR merged
// Post|Plan page passes '(cr)'. No chrome here — parents own headers.

const DOT: Record<string, string> = { easy: theme.colors.easy, medium: theme.colors.medium, hard: theme.colors.hard };

export function PlannerList({ base }: { base: '(student)' | '(cr)' }) {
  const router = useRouter();
  const { tasks, toggleDone } = usePlannerStore();
  const [celebrate, setCelebrate] = useState(false);

  const toggle = (id: string, done: boolean) => {
    toggleDone(id);
    if (!done) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    }
  };

  return (
    <View style={styles.wrap}>
      {celebrate && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <SuccessBanner message="Nice, one less thing to carry." />
        </View>
      )}
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title="Nothing planned yet" body="Add your first task and let AI arrange it by difficulty. No more last-minute stress." actionLabel="Add your first task" onAction={() => router.push(`${base}/itinerary/add` as never)} />
        }
        renderItem={({ item, index }) => {
          const isDone = item.status === 'done';
          return (
            <Pressable onPress={() => router.push(`${base}/itinerary/${item.id}` as never)} style={styles.row}>
              {/* stopPropagation: tapping the checkbox must not open the detail. */}
              <Pressable
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  toggle(item.id, isDone);
                }}
                hitSlop={8}
                style={[styles.box, isDone && styles.boxDone]}>
                {isDone && <Text style={styles.tick}>✓</Text>}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isDone && styles.strike]}>{item.title}</Text>
                <Text style={styles.meta}>{item.scheduledDate} · AI order #{index + 1}</Text>
              </View>
              <View style={[styles.pill, { borderColor: `${DOT[item.difficulty]}44`, backgroundColor: `${DOT[item.difficulty]}14` }]}>
                <View style={[styles.dot, { backgroundColor: DOT[item.difficulty] }]} />
                <Text style={[styles.pillText, { color: DOT[item.difficulty] }]}>{item.difficulty}</Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable onPress={() => router.push(`${base}/itinerary/add` as never)} style={styles.fab}>
        <Text style={styles.fabText}>+ Add task</Text>
      </Pressable>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  wrap: { flex: 1 },
  list: { padding: theme.spacing.md, paddingBottom: theme.layout.tabClearance + 72 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg,
    padding: theme.spacing.sm, marginBottom: 8,
    minHeight: theme.layout.rowMinHeight, ...theme.shadow.card,
  },
  box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  boxDone: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tick: { color: theme.colors.onPrimary, fontFamily: theme.font.bold, fontWeight: '700' },
  title: { ...theme.type.body, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  meta: { ...theme.type.caption, color: theme.colors.secondary },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, fontFamily: theme.font.bold, fontWeight: '700', textTransform: 'capitalize' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  fab: {
    position: 'absolute', bottom: theme.layout.tabClearance, left: 16, right: 16, backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg, minHeight: 52, alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: theme.colors.onPrimary, fontFamily: theme.font.bold, fontWeight: '700', fontSize: 15 },
}));

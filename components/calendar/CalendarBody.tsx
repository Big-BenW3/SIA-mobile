import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/shared/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/States';
import { usePostsStore } from '@/stores/postsStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatDue } from '@/utils/due';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── CalendarBody (shared, both roles) ──────────────────────────────
// Real dates throughout: the strip is the current week, the grid is the
// current month, hot dots derive from post due-dates + school events.
// Personal tasks (dateless labels) always list under the day — they are
// reminders, not calendar pins. `base` scopes drill-down navigation.

function startOfWeekMonday(now: Date): Date {
  const d = new Date(now);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarBody({ base }: { base: '(student)' | '(cr)' }) {
  const router = useRouter();
  const { posts } = usePostsStore();
  const { tasks } = usePlannerStore();
  const session = useSessionStore();
  const [mode, setMode] = useState<'Daily' | 'Semester'>('Daily');

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const [selected, setSelected] = useState<string>(() => dayKey(new Date()));

  const parseDate = (iso: string | null | undefined): Date | null => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const dueMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string; courseCode: string; dueDate: string }[]>();
    for (const p of posts) {
      const d = parseDate(p.dueDate);
      if (!d) continue;
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push({ id: p.id, title: p.title, courseCode: p.courseCode ?? '', dueDate: p.dueDate as string });
    }
    return map;
  }, [posts]);

  const eventMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string; description: string | null }[]>();
    for (const e of session.events) {
      const d = parseDate(e.eventDate);
      if (!d) continue;
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push({ id: e.id, title: e.title, description: e.description });
    }
    return map;
  }, [session.events]);

  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const monthCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return { offset, count };
  }, [month, year]);

  if (session.status === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader title="Calendar" showBack />
        <LoadingState variant="calendar" message="Loading your calendar…" />
      </SafeAreaView>
    );
  }

  if (session.status === 'error') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader title="Calendar" showBack />
        <ErrorState message={session.error} actionLabel="Retry" onAction={() => session.load()} />
      </SafeAreaView>
    );
  }

  const selDate = weekDays.find((d) => dayKey(d) === selected) ?? new Date();
  const dayPosts = dueMap.get(selected) ?? [];
  const dayEvents = eventMap.get(selected) ?? [];
  const empty = dayPosts.length === 0 && dayEvents.length === 0 && tasks.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader title="Calendar" showBack />
      <View style={styles.toggle}>
        {(['Daily', 'Semester'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.pill, mode === m && styles.pillActive]}>
            <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>{m}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'Daily' ? (
        <ScrollView contentContainerStyle={styles.body}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
            {weekDays.map((d) => {
              const active = dayKey(d) === selected;
              const label = `${DAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()}`;
              return (
                <Pressable key={label} onPress={() => setSelected(dayKey(d))} style={[styles.day, active && styles.dayActive]}>
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.date}>
            {selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {empty && (
            <EmptyState title="A clear day" body="No deadlines or events on this day. Enjoy it — or get ahead." />
          )}
          {dayEvents.map((e) => (
            <Card key={e.id}>
              <Text style={styles.kind}>School event</Text>
              <Text style={styles.itemTitle}>{e.title}</Text>
              {!!e.description && <Text style={styles.meta}>{e.description}</Text>}
            </Card>
          ))}
          {dayPosts.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`${base}/post/${p.id}` as never)}>
              <Card>
                <Text style={styles.kind}>CR post · {p.courseCode}</Text>
                <Text style={styles.itemTitle}>{p.title}</Text>
                <Text style={styles.meta}>{formatDue(p.dueDate)}</Text>
              </Card>
            </Pressable>
          ))}
          {tasks.filter((t) => t.status === 'pending').map((t) => (
            <Pressable key={t.id} onPress={() => router.push(`${base}/itinerary/${t.id}` as never)}>
              <Card>
                <Text style={styles.kind}>My task · {t.difficulty}</Text>
                <Text style={styles.itemTitle}>{t.title}</Text>
                <Text style={styles.meta}>{t.scheduledDate ?? 'No date set'}</Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Card>
            <Text style={styles.itemTitle}>{MONTH_NAMES[month]} {year}</Text>
            <View style={styles.weekRow}>
              {DAY_NAMES.map((w) => (
                <Text key={w} style={[styles.weekDay, styles.weekCell]}>{w}</Text>
              ))}
            </View>
            <View style={styles.grid}>
              {Array.from({ length: monthCells.offset }, (_, i) => (
                <View key={`pad-${i}`} style={styles.cellPad} />
              ))}
              {Array.from({ length: monthCells.count }, (_, i) => i + 1).map((d) => {
                const k = `${year}-${month}-${d}`;
                const hot = dueMap.has(k) || eventMap.has(k);
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      const match = weekDays.find((x) => x.getDate() === d && x.getMonth() === month);
                      if (match) setSelected(dayKey(match));
                      setMode('Daily');
                    }}
                    style={[styles.cell, hot && styles.cellHot]}>
                    <Text style={[styles.cellText, hot && styles.cellTextHot]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.meta}>Highlighted dates have items. Tap to open the day.</Text>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  toggle: { flexDirection: 'row', gap: 8, padding: theme.spacing.md, paddingBottom: 0 },
  pill: { flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: theme.colors.inverseSurface, borderColor: theme.colors.inverseSurface },
  pillText: { fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  pillTextActive: { color: theme.colors.onInverseSurface },
  body: { padding: theme.spacing.md },
  strip: { marginBottom: 16 },
  day: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  dayActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayText: { fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  dayTextActive: { color: theme.colors.onPrimary },
  date: { ...theme.type.title, color: theme.colors.text, marginBottom: 8 },
  kind: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.accent, marginBottom: 4 },
  itemTitle: { ...theme.type.body, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  meta: { ...theme.type.caption, color: theme.colors.secondary, marginTop: 4 },
  weekRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  weekDay: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  weekCell: { width: 44, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  cell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cellPad: { width: 44, height: 44 },
  cellHot: { backgroundColor: theme.colors.softBlue, borderColor: theme.colors.primary },
  cellText: { color: theme.colors.text, fontFamily: theme.font.bold, fontWeight: '700' },
  cellTextHot: { color: theme.colors.accent },
}));

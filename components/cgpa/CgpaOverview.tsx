import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/shared/Button';
import { ChevronIcon } from '@/components/shared/Icons';
import { Card } from '@/components/shared/Screen';
import { useCgpaStore } from '@/stores/cgpaStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── CgpaOverview (shared, both roles) ──────────────────────────────
// CGPA lives behind Profile, not a tab: it is checked occasionally, not
// worked in every session. `base` scopes drill-down navigation; the
// math (credit-weighted) lives in the store, never here.

export function CgpaOverview({ base }: { base: '(student)' | '(cr)' }) {
  const router = useRouter();
  const { semesters, cgpa } = useCgpaStore();

  const value = semesters.length ? cgpa().toFixed(2) : '—';
  const best = semesters.length ? Math.max(...semesters.map((s) => s.gpa)).toFixed(2) : '—';
  const units = semesters.reduce((sum, s) => sum + s.courses.reduce((u, c) => u + c.creditUnit, 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader title="CGPA" showBack />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Current CGPA</Text>
          <Text style={styles.heroValue}>{value}</Text>
          <Text style={styles.heroSub}>of 5.00 · {semesters.length} semester{semesters.length === 1 ? '' : 's'} tracked</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{best}</Text>
            <Text style={styles.statLabel}>Best semester</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{units}</Text>
            <Text style={styles.statLabel}>Credit units</Text>
          </View>
        </View>

        <Text style={styles.heading}>Semesters</Text>
        {semesters.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`${base}/cgpa/${s.id}` as never)}
            style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{s.label}</Text>
              <Text style={styles.rowSub}>
                {s.courses.length} course{s.courses.length === 1 ? '' : 's'} ·{' '}
                {s.courses.reduce((u, c) => u + c.creditUnit, 0)} units
              </Text>
            </View>
            <Text style={styles.rowGpa}>{s.gpa.toFixed(2)}</Text>
            <ChevronIcon />
          </Pressable>
        ))}

        {semesters.length === 0 && (
          <Card>
            <Text style={styles.emptyTitle}>No semesters yet</Text>
            <Text style={styles.emptyBody}>
              Add your first semester and SIA starts tracking your CGPA from there.
            </Text>
          </Card>
        )}

        <View style={{ height: theme.spacing.md }} />
        <Button title="Add semester" onPress={() => router.push(`${base}/cgpa/add-semester` as never)} />
        <View style={{ height: theme.spacing.xs }} />
        <Button
          title="Practice questions"
          variant="secondary"
          onPress={() => router.push(`${base}/test` as never)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  body: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  hero: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl, padding: theme.spacing.lg, alignItems: 'center' },
  heroLabel: { ...theme.type.caption, color: theme.colors.primaryMuted },
  heroValue: { ...theme.type.hero, fontSize: 56, lineHeight: 62, color: theme.colors.onPrimary, fontVariant: ['tabular-nums'] },
  heroSub: { ...theme.type.caption, color: theme.colors.primaryMuted, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  stat: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: theme.spacing.md },
  statValue: { ...theme.type.title, color: theme.colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { ...theme.type.caption, color: theme.colors.secondary, marginTop: 2 },
  heading: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: theme.colors.secondary, marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: theme.spacing.md, marginBottom: theme.spacing.xs, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
  rowTitle: { ...theme.type.body, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  rowSub: { ...theme.type.caption, color: theme.colors.secondary, marginTop: 2 },
  rowGpa: { ...theme.type.title, color: theme.colors.accent, fontVariant: ['tabular-nums'] },
  emptyTitle: { ...theme.type.body, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  emptyBody: { ...theme.type.caption, color: theme.colors.secondary, marginTop: 4 },
}));

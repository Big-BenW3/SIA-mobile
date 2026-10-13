import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { themedStyles } from '@/components/themedStyles';
import { Card } from '@/components/shared/Screen';
import type { TestMode } from '@/types';

// ─── TestHub (shared, both roles) ───────────────────────────────────
// Practice deserved a permanent seat: CGPA moved to Profile (checked
// occasionally), testing happens weekly. One funnel behind three modes:
// every mode asks course → level → topics before showing a question.
// `base` scopes mode navigation to the caller's group.

const MODES: { id: TestMode; title: string; subtitle: string; glyph: string }[] = [
  {
    id: 'study',
    title: 'Study Mode',
    subtitle: 'One question at a time, answer revealed as you go. No clock, no score, just the material.',
    glyph: '◎',
  },
  {
    id: 'cbt',
    title: 'CBT Mode',
    subtitle: 'Timed paper, multiple choice, score and full review at the end. The exam-hall rehearsal.',
    glyph: '◔',
  },
  {
    id: 'past',
    title: 'Past Questions',
    subtitle: 'Old questions with answers shown side by side. The night-before read.',
    glyph: '☷',
  },
];

export function TestHub({ base }: { base: '(student)' | '(cr)' }) {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Text style={styles.hero}>Test yourself</Text>
      <Text style={styles.heroSub}>
        Pick a course, pick a level, then take the whole course or narrow it to the topics you are shaky on.
      </Text>

      {MODES.map((m) => (
        <Card key={m.id} style={styles.modeCard} onPress={() => router.push(`${base}/test/${m.id}` as never)}>
          <View style={styles.modeIcon}>
            <Text style={styles.modeIconText}>{m.glyph}</Text>
          </View>
          <View style={styles.modeText}>
            <Text style={styles.modeTitle}>{m.title}</Text>
            <Text style={styles.modeSub}>{m.subtitle}</Text>
          </View>
        </Card>
      ))}

      <Text style={styles.footNote}>
        Questions come from papers your CR uploads. If a course looks empty, it just has not been filled in
        yet.
      </Text>
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  body: { padding: theme.spacing.md, paddingBottom: 140 },
  hero: { ...theme.type.hero, color: theme.colors.text },
  heroSub: { ...theme.type.caption, color: theme.colors.secondary, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.md,
    marginBottom: theme.spacing.xs, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg,
  },
  modeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.softBlue },
  modeIconText: { fontSize: 22, color: theme.colors.accent },
  modeText: { flex: 1 },
  modeTitle: { ...theme.type.title, color: theme.colors.text, marginBottom: 4 },
  modeSub: { ...theme.type.caption, color: theme.colors.secondary },
  footNote: { ...theme.type.caption, color: theme.colors.secondary, marginTop: theme.spacing.lg },
}));

import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Screen';
import { ErrorState } from '@/components/shared/States';
import { useCgpaStore } from '@/stores/cgpaStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── SemesterDetail (shared, both roles) ────────────────────────────
// Unknown ids render a real 404, never another semester's data.

export function SemesterDetail() {
  const { semesterId } = useLocalSearchParams<{ semesterId: string }>();
  const router = useRouter();
  const { semesters, deleteSemester } = useCgpaStore();
  // Deletion is local (on-device SQLite) and instant, so there is no
  // in-flight server state to track.
  const [busy] = useState(false);
  const sem = semesters.find((s) => s.id === semesterId);

  if (!sem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
        <AppHeader title="Semester" showBack />
        <ErrorState title="Semester not found" message="That semester entry does not exist. It may have been deleted." actionLabel="Go back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  const remove = () =>
    Alert.alert('Delete entry?', 'This removes the semester from your CGPA.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSemester(sem.id);
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
      <AppHeader title={sem.label} showBack />
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.gpa}>{sem.gpa.toFixed(2)}</Text>
          <Text style={styles.meta}>Semester GPA · {sem.courses.length} courses</Text>
        </Card>
        {sem.courses.map((c) => (
          <Card key={c.code}>
            <View style={styles.row}>
              <View>
                <Text style={styles.code}>{c.code} · {c.creditUnit}u</Text>
                <Text style={styles.title}>{c.title}</Text>
              </View>
              <Text style={styles.grade}>{c.grade}</Text>
            </View>
          </Card>
        ))}
        <Button title={busy ? 'Deleting…' : 'Delete semester'} variant="danger" onPress={remove} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  body: { padding: theme.spacing.md },
  gpa: { fontSize: 48, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.accent, textAlign: 'center', fontVariant: ['tabular-nums'] },
  meta: { ...theme.type.caption, color: theme.colors.secondary, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 13, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.accent },
  title: { ...theme.type.body, color: theme.colors.text },
  grade: { fontSize: 28, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
}));

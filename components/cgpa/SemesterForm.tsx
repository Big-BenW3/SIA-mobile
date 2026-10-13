import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/shared/Button';
import { ErrorState, SuccessBanner } from '@/components/shared/States';
import { gpaFor, useCgpaStore, type CourseInput } from '@/stores/cgpaStore';
import type { Grade } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── SemesterForm (shared, both roles) ──────────────────────────────
// Validates before it saves: label required, every row needs a code and
// a positive unit. Live GPA preview so the save never surprises.

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function SemesterForm() {
  const router = useRouter();
  const { addSemester } = useCgpaStore();
  const [label, setLabel] = useState('');
  const [rows, setRows] = useState<CourseInput[]>([{ code: '', title: '', creditUnit: 3, grade: 'A' }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedGpa, setSavedGpa] = useState<number | null>(null);

  const patch = (i: number, p: Partial<CourseInput>) =>
    setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const submit = () => {
    if (!label.trim()) return setError('Give this semester a label first.');
    for (const [i, r] of rows.entries()) {
      if (!r.code.trim()) return setError(`Row ${i + 1}: enter a course code.`);
      if (!Number.isInteger(r.creditUnit) || r.creditUnit <= 0) return setError(`Row ${i + 1}: unit must be a whole number above 0.`);
    }
    setError('');
    const gpa = gpaFor(rows);
    // SQLite writes are synchronous — save for real, then confirm and go.
    addSemester(label.trim(), rows.map((r) => ({ ...r, code: r.code.trim().toUpperCase(), title: r.title.trim() || r.code.trim().toUpperCase() })));
    setBusy(false);
    setSavedGpa(gpa);
    setTimeout(() => router.back(), 900);
  };

  const preview = gpaFor(rows.filter((r) => r.code.trim() && r.creditUnit > 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
      <AppHeader title="Add semester" showBack />
      <ScrollView contentContainerStyle={styles.body}>
        <Field label="Semester label" value={label} onChangeText={setLabel} placeholder="e.g. 1st Semester 300L" />
        {rows.map((r, i) => (
          <View key={i}>
            <View style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Field label="Course code" value={r.code} onChangeText={(t) => patch(i, { code: t })} placeholder="CSC 301" />
              </View>
              <View style={{ width: 72 }}>
                <Field
                  label="Unit"
                  value={r.creditUnit ? String(r.creditUnit) : ''}
                  onChangeText={(t) => patch(i, { creditUnit: Number.parseInt(t.replace(/[^0-9]/g, ''), 10) || 0 })}
                  placeholder="3"
                />
              </View>
            </View>
            <Text style={styles.label}>{r.code.trim() || `Course ${i + 1}`} grade</Text>
            <View style={styles.grades}>
              {GRADES.map((g) => (
                <Pressable key={g} onPress={() => patch(i, { grade: g })} style={[styles.grade, r.grade === g && styles.gradeActive]}>
                  <Text style={[styles.gradeText, r.grade === g && { color: theme.colors.onPrimary }]}>{g}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: 8 }} />
          </View>
        ))}
        <Button title="+ Add course row" variant="secondary" onPress={() => setRows((rs) => [...rs, { code: '', title: '', creditUnit: 2, grade: 'B' }])} />
        <View style={{ height: 8 }} />
        <Text style={styles.preview}>Semester GPA preview: {preview.toFixed(2)}</Text>
        {savedGpa !== null && <SuccessBanner message={`Saved. GPA ${savedGpa.toFixed(2)}, CGPA updated.`} />}
        {error ? (
          <View style={{ marginBottom: 8 }}>
            <ErrorState title="Check this entry" message={error} />
          </View>
        ) : null}
        <Button title={busy ? 'Saving…' : 'Save & calculate'} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  body: { padding: theme.spacing.md, paddingBottom: 32 },
  rowCard: { flexDirection: 'row', gap: 8 },
  label: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  grades: { flexDirection: 'row', gap: 8 },
  grade: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  gradeActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  gradeText: { fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.text },
  preview: { ...theme.type.caption, color: theme.colors.secondary, textAlign: 'center', marginVertical: 8, fontVariant: ['tabular-nums'] },
}));

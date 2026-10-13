import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import type { Difficulty, PostType } from '@/types';
import { themedStyles } from '@/components/themedStyles';

const POST_LABEL: Record<PostType, string> = {
  assignment: 'Assignment',
  test: 'Test',
  lecture: 'Lecture',
  announcement: 'Notice',
};

export function PostTypeChip({ type }: { type: PostType }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{POST_LABEL[type]}</Text>
    </View>
  );
}

export function DifficultyDot({ level }: { level: Difficulty | null }) {
  if (!level) return null;
  const color =
    level === 'easy' ? theme.colors.easy : level === 'medium' ? theme.colors.medium : theme.colors.hard;
  const label = level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard';
  return (
    <View style={[styles.diff, { backgroundColor: `${color}14`, borderColor: `${color}33` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.diffText, { color }]}>{label}</Text>
    </View>
  );
}

export function CourseTag({ code }: { code: string }) {
  return (
    <View style={styles.course}>
      <Text style={styles.courseText}>{code}</Text>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  chip: { backgroundColor: theme.colors.inverseSurface, borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { ...theme.type.caption, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.onInverseSurface },
  course: { backgroundColor: theme.colors.softBlue, borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  courseText: { ...theme.type.caption, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.accent },
  diff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  diffText: { ...theme.type.caption, fontWeight: '700', fontFamily: theme.font.bold },
  dot: { width: 8, height: 8, borderRadius: 4 },
}));

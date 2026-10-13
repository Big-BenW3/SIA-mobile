import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Button } from '@/components/shared/Button';
import { useAuthStore } from '@/stores/authStore';
import { FeedArt } from '@/components/illustrations/FeedArt';
import { CalendarArt } from '@/components/illustrations/CalendarArt';
import { GraduationArt } from '@/components/illustrations/GraduationArt';
import { themedStyles } from '@/components/themedStyles';

const { width } = Dimensions.get('window');

// One illustration per promise. unDraw artwork (https://undraw.co),
// recoloured to the app palette in components/illustrations/.
const SLIDES = [
  {
    key: 'feed',
    Art: FeedArt,
    title: 'Your level,\nall in one place.',
    body: 'Verified updates from your CRs: assignments, tests and lectures in one trusted feed. No more lost WhatsApp messages.',
  },
  {
    key: 'deadlines',
    Art: CalendarArt,
    title: 'Never miss\na deadline.',
    body: 'Due-date countdowns, a calendar that merges everything, and a nudge the moment your CR posts.',
  },
  {
    key: 'plan',
    Art: GraduationArt,
    title: 'Plan smart,\ngraduate strong.',
    body: 'AI-arranged study tasks, course files, and a CGPA tracker that grows with you. You showed up — that’s huge.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);
  const last = index === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/(auth)/welcome' as never);
  };

  const goLogin = () => {
    completeOnboarding();
    router.replace('/(auth)/login' as never);
  };

  const next = () => {
    if (last) return finish();
    list.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.root}>
      {!last && (
        <Pressable onPress={finish} hitSlop={16} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.art}>
              <item.Art />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={last ? 'Get started' : 'Continue'} onPress={next} />
        <Pressable onPress={goLogin} style={styles.login}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 64 },
  skip: { position: 'absolute', top: 64, right: 24, zIndex: 1, minHeight: 44, justifyContent: 'center' },
  skipText: { ...theme.type.body, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.secondary },
  slide: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' },
  art: {
    backgroundColor: theme.colors.softBlue,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  title: { ...theme.type.hero, color: theme.colors.text, marginBottom: 8 },
  body: { ...theme.type.body, color: theme.colors.secondary },
  footer: { padding: theme.spacing.md, paddingBottom: 40, gap: 16 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { width: 28, backgroundColor: theme.colors.primary },
  login: { minHeight: 24, alignItems: 'center', justifyContent: 'center' },
  loginText: { ...theme.type.body, color: theme.colors.secondary },
  loginLink: { color: theme.colors.accent, fontFamily: theme.font.bold, fontWeight: '700' },
}));

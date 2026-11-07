import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import {
  BookIcon,
  ChevronIcon,
  ClockIcon,
  FileIcon,
} from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { Reveal } from "@/components/shared/Reveal";
import type { TestMode } from "@/types";

// ─── TestHub (shared, both roles) ───────────────────────────────────
// Practice deserved a permanent seat: CGPA moved to Profile (checked
// occasionally), testing happens weekly. One funnel behind three modes:
// every mode asks course → paper → topics before showing a question.
// `base` scopes mode navigation to the caller's group.

const MODES: {
  id: TestMode;
  title: string;
  subtitle: string;
  tag: string;
  Icon: typeof BookIcon;
}[] = [
  {
    id: "study",
    title: "Study Mode",
    subtitle:
      "One question at a time, answer revealed as you go. No clock, no score, just the material.",
    tag: "No clock",
    Icon: BookIcon,
  },
  {
    id: "cbt",
    title: "CBT Mode",
    subtitle:
      "Timed paper, multiple choice, score and full review at the end. The exam-hall rehearsal.",
    tag: "Timed · scored",
    Icon: ClockIcon,
  },
  {
    id: "past",
    title: "Past Questions",
    subtitle:
      "Old questions with answers shown side by side. The night-before read.",
    tag: "Answers shown",
    Icon: FileIcon,
  },
];

export function TestHub({ base }: { base: "(student)" | "(cr)" }) {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      <Reveal index={0}>
        <Text style={styles.hero} accessibilityRole="header">
          Test yourself
        </Text>
        <Text style={styles.heroSub}>
          Pick a course and a paper, then take the whole thing or narrow it to
          the topics you are shaky on.
        </Text>
      </Reveal>

      {MODES.map((m, i) => (
        <Reveal key={m.id} index={i + 1}>
          <PressableScale
            onPress={() => router.push(`${base}/test/${m.id}` as never)}
            haptic="light"
            style={styles.modeCard}
            accessibilityRole="button"
            accessibilityLabel={`${m.title}. ${m.tag}. ${m.subtitle}`}
          >
            <View style={styles.modeIcon}>
              <m.Icon color={theme.colors.accent} />
            </View>
            <View style={styles.modeText}>
              <View style={styles.titleRow}>
                <Text style={styles.modeTitle}>{m.title}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{m.tag}</Text>
                </View>
              </View>
              <Text style={styles.modeSub}>{m.subtitle}</Text>
            </View>
            <ChevronIcon />
          </PressableScale>
        </Reveal>
      ))}

      <Text style={styles.footNote}>
        Questions are still being uploaded, so some courses may be empty.
      </Text>
    </ScrollView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    body: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance,
    },
    hero: { ...theme.type.hero, color: theme.colors.text },
    heroSub: {
      ...theme.type.body,
      color: theme.colors.secondary,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
    modeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      ...theme.shadow.card,
    },
    modeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.softBlue,
    },
    modeText: { flex: 1, gap: 4 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
    },
    modeTitle: { ...theme.type.title, color: theme.colors.text },
    tag: {
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
    },
    tagText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.secondary,
    },
    modeSub: { ...theme.type.caption, color: theme.colors.secondary },
    footNote: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: theme.spacing.lg,
      textAlign: "center",
    },
  }),
);

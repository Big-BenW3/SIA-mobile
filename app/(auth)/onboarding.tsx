import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { Button } from "@/components/shared/Button";
import { PressableScale } from "@/components/shared/PressableScale";
import { BackIcon, ClockIcon, SparklesIcon } from "@/components/shared/Icons";
import { Mascot, type MascotPose } from "@/components/mascot/Mascot";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { Stage } from "@/components/mascot/Stage";
import { useAuthStore } from "@/stores/authStore";
import { themedStyles } from "@/components/themedStyles";

// ─── Onboarding ─────────────────────────────────────────────────────
// Three short steps, one promise each, led by Stax (conversational, in the
// spirit of Brilliant) on a clean typographic page (in the spirit of X).
// The panel and copy are driven by the scroll position, so motion follows the
// finger and is interruptible by construction. Skip and "Log in" are always
// one tap away; back is explicit once you have moved on.

interface Slide {
  key: string;
  pose: MascotPose;
  bubble: string;
  title: string;
  body: string;
  Preview: React.ComponentType;
}

const SLIDES: Slide[] = [
  {
    key: "feed",
    pose: "wave",
    bubble: "Hi, I'm Stax!",
    title: "Your level,\nall in one place.",
    body: "Verified updates from your CRs: assignments, tests and lectures in one trusted feed. No more lost WhatsApp messages.",
    Preview: FeedPreview,
  },
  {
    key: "deadlines",
    pose: "point",
    bubble: "Eyes on the date.",
    title: "Never miss\na deadline.",
    body: "Due-date countdowns, a calendar that merges everything, and a nudge the moment your CR posts.",
    Preview: DeadlinePreview,
  },
  {
    key: "plan",
    pose: "think",
    bubble: "Let me sort that out.",
    title: "Plan smart,\ngraduate strong.",
    body: "AI-arranged study tasks, course files, and a CGPA tracker that grows with you.",
    Preview: PlanPreview,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useAuthStore();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const last = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  const finish = () => {
    completeOnboarding();
    router.replace("/(auth)/welcome" as never);
  };
  const goLogin = () => {
    completeOnboarding();
    router.replace("/(auth)/login" as never);
  };
  const goTo = (i: number) => {
    list.current?.scrollToIndex({ index: i, animated: !reduce });
    setIndex(i);
  };
  const next = () => (last ? finish() : goTo(index + 1));

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        {index > 0 ? (
          <PressableScale
            onPress={() => goTo(index - 1)}
            style={styles.topBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <BackIcon />
          </PressableScale>
        ) : (
          <View style={styles.topBtn} />
        )}
        {!last && (
          <PressableScale
            onPress={finish}
            style={styles.skip}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
          >
            <Text style={styles.skipText}>Skip</Text>
          </PressableScale>
        )}
      </View>

      <Animated.FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index: i }) => (
          <SlideView item={item} i={i} width={width} scrollX={scrollX} />
        )}
      />

      <View style={styles.footer}>
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((s, i) => (
            <Dot key={s.key} i={i} width={width} scrollX={scrollX} />
          ))}
        </View>
        <Button title={last ? "Get started" : "Continue"} onPress={next} />
        <PressableScale
          onPress={goLogin}
          style={styles.login}
          accessibilityRole="link"
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

function SlideView({
  item,
  i,
  width,
  scrollX,
}: {
  item: Slide;
  i: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const reduce = useReducedMotion();

  const stage = useAnimatedStyle(() => {
    const x = scrollX.get() - i * width;
    return {
      opacity: interpolate(
        Math.abs(x),
        [0, width * 0.7],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [{ translateX: reduce ? 0 : x * 0.35 }],
    };
  });
  const copy = useAnimatedStyle(() => {
    const x = scrollX.get() - i * width;
    return {
      opacity: interpolate(
        Math.abs(x),
        [0, width * 0.5],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [{ translateX: reduce ? 0 : x * 0.12 }],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={stage}>
        <Stage style={styles.stage}>
          <SpeechBubble text={item.bubble} />
          <Mascot pose={item.pose} size={132} />
          <item.Preview />
        </Stage>
      </Animated.View>
      <Animated.View style={[styles.copy, copy]}>
        <Text style={styles.title} accessibilityRole="header">
          {item.title}
        </Text>
        <Text style={styles.body}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  i,
  width,
  scrollX,
}: {
  i: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  // A childless, absolutely-independent pill: animating its width relayouts
  // nothing but itself, so it is the one permitted layout-property animation.
  const style = useAnimatedStyle(() => {
    const r = [(i - 1) * width, i * width, (i + 1) * width];
    return {
      width: interpolate(scrollX.get(), r, [8, 28, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.get(), r, [
        theme.colors.border,
        theme.colors.primary,
        theme.colors.border,
      ]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// ─── Illustrative previews (example content, not live data) ────────

function FeedPreview() {
  return (
    <View style={styles.previewCol}>
      <MiniPost
        tag="CSC 301"
        kind="Assignment"
        line="Submit Assignment 2 by Friday"
      />
      <MiniPost
        tag="MTH 305"
        kind="Notice"
        line="Lecture moved to Hall B"
        faded
      />
    </View>
  );
}

function DeadlinePreview() {
  return (
    <View style={styles.previewCard}>
      <View style={styles.previewRow}>
        <ClockIcon color={theme.colors.goldDeep} />
        <Text style={styles.previewTitle}>Assignment 2</Text>
      </View>
      <Text style={styles.previewMono}>2 days left</Text>
    </View>
  );
}

function PlanPreview() {
  return (
    <View style={styles.previewCol}>
      <View style={styles.previewCard}>
        <View style={styles.previewRow}>
          <SparklesIcon color={theme.colors.goldDeep} />
          <Text style={styles.previewTitle}>Arranged by difficulty</Text>
        </View>
      </View>
    </View>
  );
}

function MiniPost({
  tag,
  kind,
  line,
  faded,
}: {
  tag: string;
  kind: string;
  line: string;
  faded?: boolean;
}) {
  return (
    <View style={[styles.previewCard, faded && { opacity: 0.55 }]}>
      <View style={styles.previewRow}>
        <View style={styles.miniTag}>
          <Text style={styles.miniTagText}>{tag}</Text>
        </View>
        <Text style={styles.miniKind}>{kind}</Text>
      </View>
      <Text style={styles.previewTitle} numberOfLines={1}>
        {line}
      </Text>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      minHeight: 52,
    },
    topBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    skip: {
      minHeight: 44,
      paddingHorizontal: theme.spacing.xs,
      justifyContent: "center",
    },
    skipText: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.secondary,
    },

    slide: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: "center",
      gap: theme.spacing.lg,
    },
    stage: { minHeight: 320, paddingVertical: theme.spacing.lg },
    copy: { gap: theme.spacing.xs },
    title: { ...theme.type.hero, color: theme.colors.text },
    body: { ...theme.type.body, color: theme.colors.secondary },

    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
    },
    dots: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      justifyContent: "center",
      alignItems: "center",
      height: 8,
    },
    dot: { height: 8, borderRadius: 4 },
    login: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    loginText: { ...theme.type.body, color: theme.colors.secondary },
    loginLink: {
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },

    previewCol: { gap: theme.spacing.xs, alignSelf: "stretch" },
    previewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      gap: 4,
      minWidth: 220,
      ...theme.shadow.card,
    },
    previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    previewTitle: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    previewMono: { ...theme.type.mono, color: theme.colors.goldDeep },
    miniTag: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.full,
      paddingHorizontal: 8,
      paddingVertical: 1,
    },
    miniTagText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    miniKind: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);

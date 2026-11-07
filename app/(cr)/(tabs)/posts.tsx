import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { MyPostsBody } from "@/components/post/MyPostsBody";
import { PlannerList } from "@/components/itinerary/PlannerList";
import { themedStyles } from "@/components/themedStyles";

// ─── CR Post|Plan merged tab ────────────────────────────────────────
// One bottom tab, two top segments: the CR's publishing desk (Post) and
// their private planner (Plan, the shared student body). Tap or swipe; the
// pill is driven by the pager's scroll position, so it follows the finger.
// `?tab=plan` deep-links straight to the planner. Both pages stay mounted, so
// switching never loses scroll position or checkbox state.

const PAGES = ["Post", "Plan"] as const;

export default function PostPlanTab() {
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initial = tab === "plan" ? 1 : 0;

  const [index, setIndex] = useState(initial);
  const pager = useAnimatedRef<Animated.ScrollView>();
  const progress = useSharedValue(initial);

  const onScroll = useAnimatedScrollHandler((e) => {
    progress.set(e.contentOffset.x / width);
  });

  // The header title follows the page the pager is on: whenever the rounded
  // position changes (swipe, tap, or deep link) hand the new index to React.
  // Scrolling is the only source of truth, so there is no state to keep in sync.
  useAnimatedReaction(
    () => Math.round(progress.get()),
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setIndex, current);
    },
  );

  const go = (i: number) => {
    // The scroll handler above moves the pill (and the reaction the title).
    pager.current?.scrollTo({ x: i * width, animated: !reduce });
  };

  // `?tab=plan` can arrive after mount (navigation param): scroll to it. This
  // only drives the pager (an external system); it sets no React state.
  const lastTab = useRef(tab);
  useEffect(() => {
    if (tab === lastTab.current) return;
    lastTab.current = tab;
    if (tab === "plan") go(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title={index === 0 ? "My posts" : "My itinerary"} />

      <View style={styles.segWrap}>
        <SegmentedControl labels={PAGES} progress={progress} onPress={go} />
      </View>

      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initial * width, y: 0 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <MyPostsBody />
        </View>
        <View style={{ width }}>
          <PlannerList base="(cr)" />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    segWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
    },
  }),
);

import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { MyPostsBody } from "@/components/post/MyPostsBody";
import { PlannerList } from "@/components/itinerary/PlannerList";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── CR Post|Plan merged tab ────────────────────────────────────────
// One bottom tab, two top segments: the CR's publishing desk (Post) and
// their private planner (Plan, the shared student body). Tap or swipe;
// a sliding pill tracks the active segment. `?tab=plan` deep-links
// straight to the planner. Both pages stay mounted, so switching never
// loses scroll position or checkbox state.

const PAGES = ["Post", "Plan"] as const;

export default function PostPlanTab() {
  const { width } = useWindowDimensions();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initial = tab === "plan" ? 1 : 0;

  const [index, setIndex] = useState(initial);
  const [segWidth, setSegWidth] = useState(0);
  const pager = useRef<ScrollView>(null);
  // Sliding indicator: native-driven translateX across the two segments.
  // Lazy state init rather than a ref — the value is read while rendering.
  const [slide] = useState(() => new Animated.Value(initial));

  const go = (i: number) => {
    setIndex(i);
    Animated.timing(slide, {
      toValue: i,
      duration: 200,
      useNativeDriver: true,
    }).start();
    pager.current?.scrollTo({ x: i * width, animated: true });
  };

  // Keep param-driven entry honest if `?tab=plan` arrives after mount. This
  // is genuine external-state synchronisation (a navigation param), not a
  // value derivable during render, so the setState belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "plan" && index !== 1) go(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const page = segWidth / 2;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title={index === 0 ? "My posts" : "My itinerary"} />

      {/* Sliding top segments: same pill language as the Mine/All toggle. */}
      <View style={styles.segWrap}>
        <View
          style={styles.seg}
          onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
          accessibilityRole="tablist"
        >
          {page > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: page - 8,
                  transform: [
                    {
                      translateX: Animated.add(
                        4,
                        Animated.multiply(slide, page),
                      ),
                    },
                  ],
                },
              ]}
            />
          )}
          {PAGES.map((p, i) => (
            <Pressable
              key={p}
              onPress={() => go(i)}
              style={styles.segBtn}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === i }}
            >
              <Text
                style={[styles.segText, index === i && styles.segTextActive]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initial * width, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) go(i);
        }}
      >
        <View style={{ width }}>
          <MyPostsBody />
        </View>
        <View style={{ width }}>
          <PlannerList base="(cr)" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    segWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
    },
    seg: {
      flexDirection: "row",
      backgroundColor: theme.colors.muted,
      borderRadius: 999,
      padding: 4,
      position: "relative",
    },
    indicator: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      ...theme.shadow.card,
    },
    segBtn: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    segText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 14,
      color: theme.colors.secondary,
    },
    segTextActive: { color: theme.colors.text },
  }),
);

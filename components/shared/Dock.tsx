import { useEffect } from "react";
import { StyleSheet, View, type ColorValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { ease } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { haptic } from "./PressableScale";

// ─── Floating dock (student + CR) ──────────────────────────────────
// One geometry for both roles; only the tab set differs. Tabs are peers, so
// switching never slides (expo-router tabs don't animate between scenes). The
// only motion is the active pill fading in, 150ms, opacity only — a tab switch
// happens dozens of times a session, so it must stay near-imperceptible.

export type DockIcons = Record<
  string,
  (p: { color: ColorValue }) => React.ReactNode
>;

function DockIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.set(withTiming(focused ? 1 : 0, { duration: 150, easing: ease.out }));
  }, [focused, on]);
  const fade = useAnimatedStyle(() => ({ opacity: on.get() }));
  return (
    <View style={styles.pill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pillFill, fade]} />
      {children}
    </View>
  );
}

const DOCK_HEIGHT = 70;

function dockBottom(insetBottom: number) {
  return Math.max(insetBottom, theme.spacing.sm) + theme.spacing.xs;
}

/** Distance from the screen bottom to the dock's top edge, for floating UI. */
export function useDockTop() {
  const insets = useSafeAreaInsets();
  return dockBottom(insets.bottom) + DOCK_HEIGHT;
}

export function useDockOptions(icons: DockIcons) {
  const insets = useSafeAreaInsets();
  return ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.colors.text,
    tabBarInactiveTintColor: theme.colors.secondary,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      position: "absolute" as const,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderTopWidth: 1,
      borderRadius: theme.radius.full,
      height: DOCK_HEIGHT,
      width: "88%" as const,
      maxWidth: 440,
      marginHorizontal: "6%" as const,
      paddingTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
      bottom: dockBottom(insets.bottom),
      ...theme.shadow.card,
    },
    tabBarLabelStyle: {
      fontSize: theme.type.caption.fontSize,
      fontFamily: theme.font.bold,
      fontWeight: "700" as const,
    },
    tabBarIcon: ({
      color,
      focused,
    }: {
      color: ColorValue;
      focused: boolean;
    }) => {
      const Glyph = icons[route.name];
      return (
        <DockIcon focused={focused}>
          {Glyph ? <Glyph color={color} /> : null}
        </DockIcon>
      );
    },
  });
}

// Selection haptic when a tab is pressed; one per user action.
export const dockListeners = {
  tabPress: () => haptic("selection"),
};

const styles = themedStyles(() =>
  StyleSheet.create({
    pill: {
      minWidth: 52,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    pillFill: { backgroundColor: theme.colors.softBlue, borderRadius: 19 },
  }),
);

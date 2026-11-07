import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { theme } from "@/constants/theme";
import { ease, spring } from "@/constants/motion";
import { CloseIcon } from "./Icons";
import { PressableScale } from "./PressableScale";
import { themedStyles } from "@/components/themedStyles";

// ─── Bottom sheet ──────────────────────────────────────────────────
// A modal sheet for short forms (edit profile, change password, info). It is
// laid out once and slid with translateY on the UI runtime, so opening,
// dragging and closing never relayout. The handle drags: a quick flick OR a
// third of the height dismisses; otherwise it springs back with the release
// velocity. The keyboard pushes the sheet up and the body scrolls if the
// content no longer fits. Visibility is controlled by `visible`; every way of
// closing (scrim, handle, X, hardware back) calls `onClose`.

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const y = useSharedValue(screenHeight);
  // Measured sheet height. A shared value (not a ref): worklets snapshot refs,
  // and the scrim fade must read the live height.
  const sheetHeight = useSharedValue(screenHeight * 0.5);
  const [mounted, setMounted] = useState(false);

  // Mount the Modal the render `visible` turns true (derived state, adjusted
  // during render rather than in an effect). It unmounts when the exit
  // animation below finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      y.set(screenHeight);
      y.set(withTiming(0, { duration: reduce ? 0 : 300, easing: ease.sheet }));
    } else {
      y.set(
        withTiming(
          screenHeight,
          { duration: reduce ? 0 : 220, easing: ease.out },
          (finished) => {
            if (finished) scheduleOnRN(setMounted, false);
          },
        ),
      );
    }
    // y is stable; screenHeight only changes on rotation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startY = useRef(0);
  const pan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 3,
        onPanResponderGrant: () => {
          cancelAnimation(y);
          startY.current = y.get();
        },
        onPanResponderMove: (_e, g) => {
          const raw = startY.current + g.dy;
          // Rubber-band when dragged upward past the resting position.
          y.set(raw < 0 ? raw * 0.2 : raw);
        },
        onPanResponderRelease: (_e, g) => {
          const h = sheetHeight.get();
          if (g.vy > 0.5 || y.get() > h * 0.33) {
            onClose();
            return;
          }
          y.set(
            withSpring(0, {
              ...spring.sheet,
              velocity: g.vy * 1000,
              overshootClamping: true,
            }),
          );
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose, screenHeight],
  );

  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(y.get(), -24) }],
  }));
  const scrim = useAnimatedStyle(() => ({
    opacity: interpolate(
      y.get(),
      [0, Math.max(sheetHeight.get(), 1)],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { maxHeight: screenHeight * 0.9 }, sheet]}
          onLayout={(e) => {
            sheetHeight.set(e.nativeEvent.layout.height);
          }}
        >
          <View {...pan.panHandlers} style={styles.dragZone}>
            <View style={styles.handle} />
            <View style={styles.headRow}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              <PressableScale
                onPress={onClose}
                hitSlop={8}
                style={styles.close}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <CloseIcon size={20} />
              </PressableScale>
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.body,
              { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    scrim: { backgroundColor: theme.colors.scrim },
    sheet: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      backgroundColor: theme.colors.sheet,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      overflow: "hidden",
    },
    dragZone: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
    },
    handle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: theme.spacing.xs,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { ...theme.type.title, color: theme.colors.text },
    close: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -theme.spacing.xs,
    },
    body: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
  }),
);

import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration } from "@/constants/motion";
import { metaGet, metaSet } from "@/db/personal";
import { getPushStatus, registerPushToken } from "@/services/push";
import { sessionApi } from "@/services/session.service";
import { Button } from "./Button";
import { Mascot } from "@/components/mascot/Mascot";
import { themedStyles } from "@/components/themedStyles";

// ─── Notification primer ───────────────────────────────────────────
// The OS permission dialog is a one-shot: if the user declines out of context
// it is hard to win back. So we explain the value first, in the product's own
// voice, and only call the system prompt when they tap "Turn on". "Not now"
// is remembered; the profile screen keeps the real controls.

const DISMISSED_KEY = "pushPrimerDismissed";

export function NotificationPrimer() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      if (metaGet(DISMISSED_KEY)) return;
      const status = await getPushStatus();
      if (live && status === "undetermined") setShow(true);
    })();
    return () => {
      live = false;
    };
  }, []);

  const dismiss = () => {
    metaSet(DISMISSED_KEY, "1");
    setShow(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      const token = await registerPushToken({ prompt: true });
      if (token) {
        try {
          await sessionApi.registerPushToken(token);
        } catch {
          // Push stays unavailable; the app works without it.
        }
      }
    } finally {
      setBusy(false);
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(duration.enter)}
      exiting={reduce ? undefined : FadeOut.duration(duration.small)}
      style={styles.card}
    >
      <View style={styles.row}>
        <Mascot pose="point" size={64} />
        <View style={styles.copy}>
          <Text style={styles.title}>Never miss a post</Text>
          <Text style={styles.body}>
            Get a nudge when your CR posts or a deadline is close. You can
            change this any time in Profile.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          title="Turn on"
          onPress={enable}
          loading={busy}
          style={styles.flex}
        />
        <Button
          title="Not now"
          variant="ghost"
          onPress={dismiss}
          disabled={busy}
          style={styles.flex}
        />
      </View>
    </Animated.View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      ...theme.shadow.card,
    },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    copy: { flex: 1, gap: 2 },
    title: { ...theme.type.title, color: theme.colors.text },
    body: { ...theme.type.caption, color: theme.colors.secondary },
    actions: { flexDirection: "row", gap: theme.spacing.xs },
    flex: { flex: 1 },
  }),
);

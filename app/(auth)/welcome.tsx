import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease, stagger } from "@/constants/motion";
import { Button } from "@/components/shared/Button";
import { Mascot } from "@/components/mascot/Mascot";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { Stage } from "@/components/mascot/Stage";
import { themedStyles } from "@/components/themedStyles";

// ─── Welcome ────────────────────────────────────────────────────────
// First screen a new student sees. Stax says hello, one promise, three ways
// in — the CR path is quieter than the student path because most people
// opening this app are students. First-run, so the entrance can have delight:
// a short stagger, nothing that blocks a tap.

export default function Welcome() {
  const router = useRouter();
  const reduce = useReducedMotion();

  const rise = (i: number) =>
    reduce
      ? FadeIn.duration(duration.small)
      : FadeInDown.delay(i * stagger.step)
          .duration(duration.enter)
          .easing(ease.out);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={rise(0)}>
          <Stage style={styles.stage}>
            <SpeechBubble text="Hi, I'm Stax. I'll keep your level on track." />
            <Mascot
              pose="wave"
              size={168}
              label="Stax the mascot waving hello"
            />
          </Stage>
        </Animated.View>

        <View style={styles.copy}>
          <Animated.Text
            entering={rise(2)}
            style={styles.title}
            accessibilityRole="header"
          >
            Your level,{"\n"}all in one place.
          </Animated.Text>
          <Animated.Text entering={rise(3)} style={styles.sub}>
            Verified updates from your Course Reps, every deadline in sight, and
            a planner that knows what is due next.
          </Animated.Text>
        </View>

        <Animated.View entering={rise(4)} style={styles.cta}>
          <Button
            title="Create account"
            onPress={() => router.push("/(auth)/signup-student" as never)}
          />
          <Button
            title="Log in"
            variant="secondary"
            onPress={() => router.push("/(auth)/login" as never)}
          />
          <Button
            title="I'm a Course Rep"
            variant="ghost"
            onPress={() => router.push("/(auth)/signup-cr" as never)}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    scroll: {
      flexGrow: 1,
      justifyContent: "space-between",
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
    },
    stage: { minHeight: 300, paddingVertical: theme.spacing.lg },
    copy: { gap: theme.spacing.xs },
    title: { ...theme.type.hero, color: theme.colors.text },
    sub: { ...theme.type.body, color: theme.colors.secondary },
    cta: { gap: theme.spacing.xs },
  }),
);

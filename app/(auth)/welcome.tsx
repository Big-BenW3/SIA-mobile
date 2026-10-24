import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { Button } from "@/components/shared/Button";
import { WelcomeArt } from "@/components/illustrations/WelcomeArt";
import { themedStyles } from "@/components/themedStyles";
import { LogoMark } from "@/components/brand/Logos";
import { useBrandStore } from "@/stores/brandStore";

// ─── Welcome ────────────────────────────────────────────────────────
// First screen a new student sees. One promise, one illustration, three
// ways in — the CR path is quieter than the student path because most
// people opening this app are students.

export default function Welcome() {
  const router = useRouter();
  const { choice } = useBrandStore();

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <LogoMark choice={choice ?? "C"} size={26} />
        </View>
        <Text style={styles.brandName}>SuperStack</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.art}>
          <WelcomeArt />
        </View>
        <Text style={styles.title}>Your level,{"\n"}all in one place.</Text>
        <Text style={styles.sub}>
          Verified updates from your Course Reps, every deadline in sight, and a
          planner that knows what is due next.
        </Text>
      </View>

      <View style={styles.cta}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingTop: theme.spacing.md,
    },
    mark: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    brandName: { ...theme.type.caption, color: theme.colors.secondary },

    hero: { flex: 1, justifyContent: "center", gap: theme.spacing.lg },
    art: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.xl,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    title: { ...theme.type.hero, color: theme.colors.text },
    sub: { ...theme.type.body, color: theme.colors.secondary },

    cta: { gap: theme.spacing.xs, paddingBottom: theme.spacing.md },
  }),
);

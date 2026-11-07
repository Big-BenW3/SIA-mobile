import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/shared/Button";
import { Mascot } from "@/components/mascot/Mascot";
import { themedStyles } from "@/components/themedStyles";

// Shown when the server holds a CR request for admin approval (login returns
// the requested level instead of tokens). The gate routes here; logging out
// clears the pending state and returns to the welcome screen.
export default function PendingApproval() {
  const { pendingLevel, logout } = useAuthStore();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.body}>
        <Mascot pose="sleep" size={148} />
        <Text style={styles.title}>Under review</Text>
        <Text style={styles.sub}>
          Your Course Rep request{pendingLevel ? ` for ${pendingLevel}` : ""} is
          with an admin. You&apos;ll get full access once it&apos;s approved.
          Log in again any time to check.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button title="Back to welcome" variant="secondary" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
    },
    body: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.type.hero,
      color: theme.colors.text,
      textAlign: "center",
    },
    sub: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
      maxWidth: 360,
    },
    footer: { paddingBottom: theme.spacing.md },
  }),
);

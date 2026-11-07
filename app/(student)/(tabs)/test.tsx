import { StyleSheet } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";
import { AppHeader } from "@/components/shared/AppHeader";
import { TestHub } from "@/components/test/TestHub";
import { SafeAreaView } from "react-native-safe-area-context";

// Student Test tab: chrome + shared hub.
export default function TestHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Test" />
      <TestHub base="(student)" />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
  }),
);

import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { PostFeed } from "@/components/post/PostFeed";
import { themedStyles } from "@/components/themedStyles";

// The full level feed. Home shows the three freshest posts; this is the rest,
// filterable by type, with pull-to-refresh.
export default function Updates() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Updates" showBack />
      <PostFeed base="(student)" />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
  }),
);

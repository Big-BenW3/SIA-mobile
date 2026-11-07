import { StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { Button } from "@/components/shared/Button";
import { Mascot } from "@/components/mascot/Mascot";
import { themedStyles } from "@/components/themedStyles";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: "Page not found" }} />
      <View style={styles.container}>
        <Mascot pose="error" size={132} />
        <Text style={styles.title}>This screen doesn&apos;t exist</Text>
        <Text style={styles.body}>
          The link may be out of date, or the post may have been removed by your
          CR.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
          <Button
            title="Take me home"
            variant="secondary"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
    },
    title: {
      ...theme.type.hero,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
    body: {
      ...theme.type.body,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: theme.spacing.xs,
      maxWidth: 360,
    },
    actions: {
      alignSelf: "stretch",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.lg,
    },
  }),
);

import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { CourseList } from "@/components/resources/CourseList";
import { themedStyles } from "@/components/themedStyles";

// CR Files tab: the same read-only library students see (the library is
// admin-managed; CRs attach files to their own posts instead).
export default function ResourcesHome() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Resources" />
      <CourseList
        base="(cr)"
        emptyBody="Courses for your level appear here once an admin adds them for the semester."
      />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
  }),
);

import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { CourseList } from "@/components/resources/CourseList";
import { themedStyles } from "@/components/themedStyles";

// Student Files tab: chrome + shared course list.
export default function ResourcesHome() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="Resources" />
      <CourseList
        base="(student)"
        emptyBody="Courses for your level appear here once they are added for the semester."
      />
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
  }),
);

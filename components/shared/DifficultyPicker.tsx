import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import type { Difficulty } from "@/types";
import { themedStyles } from "@/components/themedStyles";
import { SelectChip } from "./Chips";

// Pick a difficulty from fixed options. Replaces the free-text field that let
// any string be saved as a difficulty. `allowNone` adds "None" for places
// where difficulty is optional (CR posts).

const OPTIONS: { value: Difficulty; label: string; tone: string }[] = [
  { value: "easy", label: "Easy", tone: theme.colors.easy },
  { value: "medium", label: "Medium", tone: theme.colors.medium },
  { value: "hard", label: "Hard", tone: theme.colors.hard },
];

export function DifficultyPicker({
  value,
  onChange,
  allowNone,
  label = "Difficulty",
}: {
  value: Difficulty | null;
  onChange: (v: Difficulty | null) => void;
  allowNone?: boolean;
  label?: string;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {allowNone && (
          <SelectChip
            label="None"
            selected={value === null}
            onPress={() => onChange(null)}
          />
        )}
        {OPTIONS.map((o) => (
          <SelectChip
            key={o.value}
            label={o.label}
            tone={o.tone}
            dot={o.tone}
            selected={value === o.value}
            onPress={() => onChange(o.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
  }),
);

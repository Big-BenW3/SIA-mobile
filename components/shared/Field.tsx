import { StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "@/constants/theme";
import { themedStyles } from "@/components/themedStyles";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { minHeight: 96, textAlignVertical: "top" },
          !!error && styles.inputError,
        ]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
      ...theme.type.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.input,
    },
    inputError: { borderColor: theme.colors.danger },
    error: { ...theme.type.caption, color: theme.colors.danger, marginTop: 4 },
  }),
);

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { Screen, H1, Sub } from "@/components/shared/Screen";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { useAuthStore } from "@/stores/authStore";
import { themedStyles } from "@/components/themedStyles";

const LEVELS = ["100L", "200L", "300L", "400L", "500L"];

export default function SignupCR() {
  const router = useRouter();
  const { signupCR, status, error: serverError, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("300L");
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setLocalError("Enter your full name.");
      return;
    }
    if (!email.includes("@")) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    setLocalError("");
    clearError();
    try {
      // Auto-approve is ON server-side until the admin dashboard exists,
      // so this lands straight in the CR app — no waiting room.
      await signupCR(name.trim(), email.trim(), password, level);
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const shown = localError || serverError;

  return (
    <Screen>
      <H1>Request CR access</H1>
      <Sub>Pick the level you rep. Access opens immediately.</Sub>
      <Field
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="Adaeze Okafor"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@school.edu"
      />
      <Text style={styles.label}>Level requested</Text>
      <View style={styles.chips}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => setLevel(l)}
            style={[styles.chip, level === l && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, level === l && styles.chipTextActive]}
            >
              {l}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 6 characters"
        secureTextEntry
        error={shown || undefined}
      />
      <Button
        title={status === "loading" ? "Sending request…" : "Submit request"}
        onPress={submit}
      />
      <Button title="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 8,
    },
    chips: { flexDirection: "row", gap: 8, marginBottom: 16 },
    chip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
    },
    chipTextActive: { color: theme.colors.onPrimary },
  }),
);

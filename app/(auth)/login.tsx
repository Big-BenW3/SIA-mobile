import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AuthScreen, FormError } from "@/components/shared/AuthScreen";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { PressableScale } from "@/components/shared/PressableScale";
import { useAuthStore } from "@/stores/authStore";
import { themedStyles } from "@/components/themedStyles";

// â”€â”€â”€ Login (real backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Client-side format checks first, per field; the server's message (wrong
// password, inactive accountâ€¦) shows as a form-level banner after submit.
// Success flips user in the store and AuthGate routes by role.

export default function Login() {
  const router = useRouter();
  const { login, status, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const passwordRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.includes("@")) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (next.email || next.password) return;
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const busy = status === "loading";
  const serverError = Object.keys(errors).length === 0 ? error : null;

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Log in to see your level feed."
      pose={busy ? "think" : serverError ? "error" : "idle"}
      footer={
        <View style={styles.links}>
          <PressableScale
            onPress={() => router.push("/(auth)/forgot-password" as never)}
            style={styles.link}
            accessibilityRole="link"
          >
            <Text style={styles.linkBold}>Forgot password?</Text>
          </PressableScale>
          <PressableScale
            onPress={() => router.replace("/(auth)/signup-student" as never)}
            style={styles.link}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>
              No account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </PressableScale>
        </View>
      }
    >
      <Field
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        placeholder="you@school.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <Field
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password)
            setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Your password"
        secureTextEntry
        revealable
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        inputRef={passwordRef}
        onSubmitEditing={submit}
        error={errors.password}
      />
      <FormError message={serverError} />
      <Button title="Log in" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    links: { marginTop: theme.spacing.md, gap: theme.spacing.xs },
    link: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    linkText: { ...theme.type.body, color: theme.colors.secondary },
    linkBold: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
  }),
);

import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AuthScreen, FormError } from "@/components/shared/AuthScreen";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { SelectChip } from "@/components/shared/Chips";
import { PressableScale } from "@/components/shared/PressableScale";
import { useAuthStore } from "@/stores/authStore";
import { themedStyles } from "@/components/themedStyles";

const LEVELS = ["100L", "200L", "300L", "400L", "500L"];

type Errors = { name?: string; email?: string; password?: string };

export default function SignupCR() {
  const router = useRouter();
  const { signupCR, status, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("300L");
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const clear = (k: keyof Errors) =>
    errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = async () => {
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!email.includes("@")) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    clearError();
    try {
      await signupCR(name.trim(), email.trim(), password, level);
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const busy = status === "loading";
  const serverError = Object.keys(errors).length === 0 ? error : null;

  return (
    <AuthScreen
      title="Become a Course Rep"
      subtitle="Post updates and deadlines for your level."
      pose={busy ? "think" : serverError ? "error" : "point"}
      footer={
        <PressableScale
          onPress={() => router.replace("/(auth)/login" as never)}
          style={styles.link}
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
          </Text>
        </PressableScale>
      }
    >
      <Field
        label="Full name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        placeholder="Adaeze Okafor"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <Field
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clear("email");
        }}
        placeholder="you@school.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        inputRef={emailRef}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />

      <View style={styles.levelBlock} accessibilityRole="radiogroup">
        <Text style={styles.label}>Level you represent</Text>
        <View style={styles.chips}>
          {LEVELS.map((l) => (
            <SelectChip
              key={l}
              label={l}
              selected={level === l}
              onPress={() => setLevel(l)}
            />
          ))}
        </View>
      </View>

      <Field
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clear("password");
        }}
        placeholder="Create a password"
        hint="At least 8 characters"
        secureTextEntry
        revealable
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        inputRef={passwordRef}
        onSubmitEditing={submit}
        error={errors.password}
      />
      <FormError message={serverError} />
      <Button title="Submit request" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    levelBlock: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
    link: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.md,
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

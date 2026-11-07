import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AuthScreen, FormError } from "@/components/shared/AuthScreen";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { PressableScale } from "@/components/shared/PressableScale";
import { useAuthStore } from "@/stores/authStore";
import { themedStyles } from "@/components/themedStyles";

// â”€â”€â”€ Student signup (real backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Join code is validated server-side against active codes; the error
// shown is the server's message (invalid/inactive/rate-limited).

type Errors = {
  name?: string;
  email?: string;
  code?: string;
  password?: string;
};

export default function SignupStudent() {
  const router = useRouter();
  const { signupStudent, status, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<TextInputInstance>(null);
  const codeRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const clear = (k: keyof Errors) =>
    errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = async () => {
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!email.includes("@")) next.email = "Enter a valid email address.";
    if (!code.trim()) next.code = "Enter the join code from your CR.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    clearError();
    try {
      await signupStudent(name.trim(), email.trim(), password, code.trim());
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const busy = status === "loading";
  const serverError = Object.keys(errors).length === 0 ? error : null;

  return (
    <AuthScreen
      title="Create account"
      subtitle="Join your level with the code from your CR. You're in right away."
      pose={busy ? "think" : serverError ? "error" : "wave"}
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
        placeholder="John Doe"
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
        onSubmitEditing={() => codeRef.current?.focus()}
        error={errors.email}
      />
      <Field
        label="Join code"
        value={code}
        onChangeText={(t) => {
          setCode(t);
          clear("code");
        }}
        placeholder="e.g. SE-300"
        hint="Ask your Course Rep for your level's code."
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        inputRef={codeRef}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.code}
      />
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
      <Button title="Create account" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
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

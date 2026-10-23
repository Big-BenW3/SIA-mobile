import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen, H1, Sub } from "@/components/shared/Screen";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { useAuthStore } from "@/stores/authStore";

// ─── Student signup (real backend) ──────────────────────────────────
// Join code is validated server-side against active codes; the error
// shown is the server's message (invalid/inactive/rate-limited).

export default function SignupStudent() {
  const router = useRouter();
  const { signupStudent, status, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
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
    if (!code.trim()) {
      setLocalError("Enter the join code from your CR.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    setLocalError("");
    clearError();
    try {
      await signupStudent(name.trim(), email.trim(), password, code.trim());
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const shown = localError || error;

  return (
    <Screen>
      <H1>Create account</H1>
      <Sub>Join with your level code. You are active immediately.</Sub>
      <Field
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="John Doe"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@school.edu"
      />
      <Field
        label="Join code"
        value={code}
        onChangeText={setCode}
        placeholder="e.g. SE-300"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 6 characters"
        secureTextEntry
        error={shown || undefined}
      />
      <Button
        title={status === "loading" ? "Creating account…" : "Create account"}
        onPress={submit}
      />
      <Button title="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, H1, Sub } from '@/components/shared/Screen';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/shared/Button';
import { useAuthStore } from '@/stores/authStore';

// ─── Login (real backend) ───────────────────────────────────────────
// Client-side format checks first; server message wins after submit.
// Success flips user in the store and AuthGate routes by role.

export default function Login() {
  const router = useRouter();
  const { login, status, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    if (!email.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Enter your password.');
      return;
    }
    setLocalError('');
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // Server message already sits in the store's error field.
    }
  };

  const shown = localError || error;
  const busy = status === 'loading';

  return (
    <Screen>
      <H1>Welcome back</H1>
      <Sub>Log in to see your level feed.</Sub>
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@school.edu" error={undefined} />
      <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry error={shown || undefined} />
      <Button title={busy ? 'Logging in…' : 'Log in'} onPress={submit} />
      <Pressable onPress={() => router.push('/(auth)/forgot-password' as never)} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.62)', fontWeight: '700' }}>Forgot password?</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(auth)/signup-student' as never)} style={{ marginTop: 8 }}>
        <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.62)' }}>
          No account? <Text style={{ color: 'rgba(255,255,255,0.62)', fontWeight: '700' }}>Sign up</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

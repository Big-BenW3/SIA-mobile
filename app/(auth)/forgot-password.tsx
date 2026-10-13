import { Screen, H1, Sub } from '@/components/shared/Screen';
import { Button } from '@/components/shared/Button';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const router = useRouter();
  return (
    <Screen>
      <H1>Reset password</H1>
      <Sub>Password reset ships in v2. For now, contact your CR or admin to regain access.</Sub>
      <Button
        title="Back to login"
        variant="secondary"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(auth)/login' as never);
        }}
      />
    </Screen>
  );
}

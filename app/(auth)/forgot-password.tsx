import { useRouter } from "expo-router";
import { AuthScreen } from "@/components/shared/AuthScreen";
import { Button } from "@/components/shared/Button";

// Password reset is not built yet; say so plainly instead of faking a form.
export default function ForgotPassword() {
  const router = useRouter();
  return (
    <AuthScreen
      title="Reset password"
      subtitle="Password reset isn't available yet. Contact your CR or an admin to regain access."
      pose="read"
    >
      <Button
        title="Back to login"
        variant="secondary"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/(auth)/login" as never);
        }}
      />
    </AuthScreen>
  );
}

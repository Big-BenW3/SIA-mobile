import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usePostsStore } from "@/stores/postsStore";
import { useNotificationStore } from "@/stores/appStores";
import { sessionApi } from "@/services/session.service";
import { registerPushToken } from "@/services/push";
import { NotificationPanel } from "@/components/shared/NotificationPanel";
import { theme } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  // Final brand typeface: Space Grotesk (400 body / 700 headings).
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <NotificationPanel />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { user, pendingLevel, hasOnboarded } = useAuthStore();
  // typedRoutes narrows `segments` to per-route tuples; the gate reads the
  // first two entries generically, so widen it to a plain string list.
  const segments = useSegments() as string[];
  const router = useRouter();

  // Post-login hydration: session first (gives levelId), then feed +
  // notifications in parallel, then best-effort push registration.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      await useSessionStore.getState().load();
      if (cancelled) return;
      const levelId = useSessionStore.getState().levelId ?? undefined;
      await Promise.all([
        usePostsStore.getState().load(levelId),
        useNotificationStore.getState().load(),
      ]);
      if (cancelled) return;
      const token = await registerPushToken();
      if (token) {
        try {
          await sessionApi.registerPushToken(token);
        } catch {
          // Push stays unavailable; the app works without it.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const inAuth = segments[0] === "(auth)";
    const screen = segments[1];
    if (!user && pendingLevel) {
      if (screen !== "pending-approval")
        router.replace("/(auth)/pending-approval" as never);
      return;
    }
    if (!user && !hasOnboarded) {
      if (screen !== "onboarding")
        router.replace("/(auth)/onboarding" as never);
      return;
    }
    if (!user && !inAuth) router.replace("/(auth)/welcome" as never);
    if (user && inAuth)
      router.replace((user.role === "cr" ? "/(cr)" : "/(student)") as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingLevel, hasOnboarded, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(cr)" />
    </Stack>
  );
}

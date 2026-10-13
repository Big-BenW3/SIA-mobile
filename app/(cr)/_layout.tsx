import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

// Stack-over-Tabs: the tab bar belongs ONLY to the (tabs) group below.
// CR power screens (new/edit post, upload, task forms…) are Stack screens,
// so they slide in above the tab bar and can never appear as tabs.
export default function CRLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.surface } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="posts/new" />
      <Stack.Screen name="posts/[id]/edit" />
      <Stack.Screen name="itinerary/add" />
      <Stack.Screen name="itinerary/[id]" />
      <Stack.Screen name="resources/[courseId]" />
      <Stack.Screen name="test/study" />
      <Stack.Screen name="test/cbt" />
      <Stack.Screen name="test/past" />
      <Stack.Screen name="cgpa/overview" />
      <Stack.Screen name="cgpa/add-semester" />
      <Stack.Screen name="cgpa/[semesterId]" />
    </Stack>
  );
}

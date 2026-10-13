import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

// Stack-over-Tabs: the tab bar belongs ONLY to the (tabs) group below.
// Every detail screen (post, calendar, add/edit forms…) is a Stack screen,
// so it slides in above the tab bar and can never appear as a tab.
export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.surface } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="itinerary/add" />
      <Stack.Screen name="itinerary/[id]" />
      <Stack.Screen name="resources/[courseId]" />
      <Stack.Screen name="cgpa/overview" />
      <Stack.Screen name="cgpa/add-semester" />
      <Stack.Screen name="cgpa/[semesterId]" />
      <Stack.Screen name="test/study" />
      <Stack.Screen name="test/cbt" />
      <Stack.Screen name="test/past" />
    </Stack>
  );
}

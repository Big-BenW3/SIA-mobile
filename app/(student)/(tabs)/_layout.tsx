import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { theme } from '@/constants/theme';
import { FolderIcon, GaugeIcon, HomeIcon, PlanIcon, UserIcon } from '@/components/shared/Icons';

// Dock shell shared visually with the CR side: fully transparent, no divider or
// drop shadow, sidebar-friendly geometry, and a soft pill for focus.
const ICONS: Record<string, (p: { color: ColorValue }) => React.ReactNode> = {
  index: (p) => <HomeIcon {...p} />,
  itinerary: (p) => <PlanIcon {...p} />,
  resources: (p) => <FolderIcon {...p} />,
  test: (p) => <GaugeIcon {...p} />,
  profile: (p) => <UserIcon {...p} />,
};

export default function StudentTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', fontFamily: theme.font.bold },
        tabBarIcon: ({ color, focused }) => {
          const Glyph = ICONS[route.name];
          return (
            <View style={[styles.pill, focused && styles.pillActive]}>
              {Glyph ? <Glyph color={color} /> : null}
            </View>
          );
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="itinerary" options={{ title: 'Plan' }} />
      <Tabs.Screen name="resources" options={{ title: 'Files' }} />
      <Tabs.Screen name="test" options={{ title: 'Test' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { minWidth: 52, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: theme.colors.softBlue },
});

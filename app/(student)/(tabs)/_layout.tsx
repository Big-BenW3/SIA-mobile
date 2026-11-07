import { Tabs } from "expo-router";
import {
  FolderIcon,
  HomeIcon,
  PlanIcon,
  TestIcon,
  UserIcon,
} from "@/components/shared/Icons";
import {
  dockListeners,
  useDockOptions,
  type DockIcons,
} from "@/components/shared/Dock";

// Student dock: Home · Plan · Files · Test · You. Shared geometry lives in Dock.
const ICONS: DockIcons = {
  index: (p) => <HomeIcon {...p} />,
  itinerary: (p) => <PlanIcon {...p} />,
  resources: (p) => <FolderIcon {...p} />,
  test: (p) => <TestIcon {...p} />,
  profile: (p) => <UserIcon {...p} />,
};

export default function StudentTabs() {
  return (
    <Tabs screenOptions={useDockOptions(ICONS)} screenListeners={dockListeners}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="itinerary" options={{ title: "Plan" }} />
      <Tabs.Screen name="resources" options={{ title: "Files" }} />
      <Tabs.Screen name="test" options={{ title: "Test" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}

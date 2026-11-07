import { Tabs } from "expo-router";
import {
  FolderIcon,
  HomeIcon,
  PenIcon,
  TestIcon,
  UserIcon,
} from "@/components/shared/Icons";
import {
  dockListeners,
  useDockOptions,
  type DockIcons,
} from "@/components/shared/Dock";

// CR dock: Home · Post (= Post|Plan merged top segments) · Files · Test · You.
// Plan lives inside Post; Test is the shared student hub (CRs are students too).
// Same geometry as the student dock — only the tab set differs.
const ICONS: DockIcons = {
  index: (p) => <HomeIcon {...p} />,
  posts: (p) => <PenIcon {...p} />,
  resources: (p) => <FolderIcon {...p} />,
  test: (p) => <TestIcon {...p} />,
  profile: (p) => <UserIcon {...p} />,
};

export default function CRTabs() {
  return (
    <Tabs screenOptions={useDockOptions(ICONS)} screenListeners={dockListeners}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="posts" options={{ title: "Post" }} />
      <Tabs.Screen name="resources" options={{ title: "Files" }} />
      <Tabs.Screen name="test" options={{ title: "Test" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}

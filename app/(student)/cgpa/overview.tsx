import { CgpaOverview } from "@/components/cgpa/CgpaOverview";

// Student wrapper: overview navigates with the caller's base.
export default function CgpaOverviewScreen() {
  return <CgpaOverview base="(student)" />;
}

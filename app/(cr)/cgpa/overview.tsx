import { CgpaOverview } from '@/components/cgpa/CgpaOverview';

// CR wrapper: same shared body — CGPA stays inside the CR stack,
// so back-navigation never leaks across groups.
export default function CRCgpaOverviewScreen() {
  return <CgpaOverview base="(cr)" />;
}

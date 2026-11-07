import { ProfileScreen } from "@/components/profile/ProfileScreen";

// CR profile: CRs are students too, so the same sections plus the role badge
// (the badge comes from the signed-in user's role in the shared body).
export default function CRProfile() {
  return <ProfileScreen base="(cr)" title="Profile" />;
}

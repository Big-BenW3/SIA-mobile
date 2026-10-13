import { useAuthStore } from '@/stores/authStore';
import { Screen, H1, Sub } from '@/components/shared/Screen';
import { Button } from '@/components/shared/Button';
import { SuccessBanner } from '@/components/shared/States';

// Dormant while CR auto-approve is ON (no admin dashboard yet): the gate
// never routes here because signup returns a session, not a pending
// state. Kept for the manual-approval era — then this screen also gains
// a real status-refresh action.
export default function PendingApproval() {
  const { pendingLevel, logout } = useAuthStore();
  return (
    <Screen>
      <SuccessBanner message="Request received" />
      <H1>Under review</H1>
      <Sub>
        Your CR request{pendingLevel ? ` for ${pendingLevel}` : ''} is with an admin. You’ll get full access once
        approved.
      </Sub>
      <Button title="Back to welcome" variant="ghost" onPress={logout} />
    </Screen>
  );
}

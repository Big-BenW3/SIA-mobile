import { Mascot } from "@/components/mascot/Mascot";

// The brand mark is Stax, the mascot, in its static idle pose. One character
// everywhere: logo, app icon, onboarding companion, loader, empty states.
export function LogoMark({ size = 36 }: { size?: number }) {
  return <Mascot pose="idle" size={size} animated={false} shadow={false} />;
}

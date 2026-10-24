import Svg, { Circle, G, Path, Polygon } from "react-native-svg";
import { theme } from "@/constants/theme";

// Final brand: SuperStack.
// The symbol combines a stacked-book outline with a rising star, expressing
// learning momentum, organized knowledge, and a premium academic workflow.

const NAVY = theme.colors.primary;
const NAVY_DARK = theme.colors.primaryDark;
const NAVY_PALE = theme.colors.primaryMuted;
const INK = theme.colors.text;

export type LogoChoice = "A" | "B" | "C";

export function LogoA({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M32 26h44l18 18v52a12 12 0 0 1-12 12H32a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12z"
        fill={NAVY}
        opacity={0.96}
      />
      <Path
        d="M76 26v18h18"
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M38 58h32M38 70h26M38 82h18"
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle cx={92} cy={34} r={12} fill="#F9C74F" />
      <Path
        d="M92 19v30M77 34h30M81 25l22 18M81 43l22-18"
        stroke="#F9C74F"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LogoB({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M26 58l18-18 18 18 18-18 18 18v28a12 12 0 0 1-12 12H38a12 12 0 0 1-12-12V58z"
        fill={NAVY}
      />
      <Path
        d="M26 58l18-18 18 18 18-18 18 18"
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={92} cy={26} r={11} fill="#F9C74F" />
      <Path
        d="M92 12v28M78 26h28"
        stroke="#F9C74F"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LogoC({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M28 42l32-20 32 20-32 20-32-20zm0 18l32 20 32-20"
        fill="none"
        stroke={NAVY}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M60 62v20" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
      <Path d="M42 82h36" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
      <Circle cx={92} cy={30} r={11} fill="#F9C74F" />
      <Path
        d="M92 16v28M78 30h28"
        stroke="#F9C74F"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LogoMark({
  choice,
  size = 36,
}: {
  choice: LogoChoice | null;
  size?: number;
}) {
  if (choice === "A") return <LogoA size={size} />;
  if (choice === "B") return <LogoB size={size} />;
  if (choice === "C") return <LogoC size={size} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M28 42l32-20 32 20-32 20-32-20zm0 18l32 20 32-20"
        fill="none"
        stroke={NAVY}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M60 62v20" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
      <Path d="M42 82h36" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
      <Circle cx={92} cy={30} r={11} fill="#F9C74F" />
      <Path
        d="M92 16v28M78 30h28"
        stroke="#F9C74F"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

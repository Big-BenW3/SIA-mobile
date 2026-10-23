import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { ColorValue } from "react-native";
import { theme } from "@/constants/theme";

// Minimal stroke icons — no emoji anywhere in the UI.
// Every icon takes an optional `color` so tab bars can tint active vs inactive
// states from the theme instead of hard-coding a single ink.

const C = theme.colors.primary;
const INK = theme.colors.text;

function Base({
  children,
  size = 22,
  color,
}: {
  children: React.ReactNode;
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? C}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function BellIcon({
  size,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Svg
      width={size ?? 22}
      height={size ?? 22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? C}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

export function CalendarIcon({
  size = 22,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Rect x={3} y={4} width={18} height={17} rx={3} />
      <Path d="M8 2v4M16 2v4M3 9.5h18" />
    </Base>
  );
}

export function PlusIcon({
  size = 22,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 8v8M8 12h8" />
    </Base>
  );
}

export function FolderIcon({
  size = 22,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Base>
  );
}

export function GaugeIcon({
  size = 22,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Path d="M12 15l4-6" />
      <Path d="M3.5 15a9 9 0 1 1 17 0" />
      <Circle cx={12} cy={15} r={1.4} fill={color ?? C} stroke="none" />
    </Base>
  );
}

export function CheckIcon({
  size = 22,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
    </Base>
  );
}

export function ChevronIcon({
  size = 18,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? INK}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.4}
    >
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

// ─── Dock / tab icons ──────────────────────────────────────────────
// Sized a touch larger than the inline icons: these sit in a 42pt pill.

export function HomeIcon({
  size = 24,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Path d="M3.5 10.5 12 3.5l8.5 7" />
      <Path d="M5.5 9.6V20h13V9.6" />
      <Path d="M10 20v-5h4v5" />
    </Base>
  );
}

export function PlanIcon({
  size = 24,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 7l1.8 1.8L8.5 6" />
      <Path d="M4 17l1.8 1.8L8.5 16" />
      <Path d="M11.5 7.5H20M11.5 17.5H20" />
      <Path d="M4 12h2M8.5 12H20" />
    </Base>
  );
}

export function UserIcon({
  size = 24,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Circle cx={12} cy={8.5} r={3.8} />
      <Path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </Base>
  );
}

export function PenIcon({
  size = 24,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 20.2h4L19.2 9a2.9 2.9 0 0 0-4.2-4.1L4 16v4.2Z" />
      <Path d="M14.4 6.1l3.5 3.5" />
    </Base>
  );
}

export { INK };

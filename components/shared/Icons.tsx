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

// ─── Glyph replacements (were unicode: ‹ ✓ ✕ ▤ ◔ ◎ ☷) ──────────────
type IconProps = { size?: number; color?: ColorValue };

export function BackIcon({ size = 24, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M15 5l-7 7 7 7" />
    </Base>
  );
}

export function CloseIcon({ size = 22, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

export function TickIcon({ size = 18, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  );
}

export function FileIcon({ size = 22, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <Path d="M14 3v5h5M9 13h6M9 17h4" />
    </Base>
  );
}

export function ClockIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Base>
  );
}

export function BookIcon({ size = 22, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <Path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    </Base>
  );
}

export function SparklesIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <Path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Base>
  );
}

export function TrashIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
    </Base>
  );
}

export function SendIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </Base>
  );
}

export function AddIcon({ size = 24, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function EyeIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </Base>
  );
}

export function EyeOffIcon({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color ?? INK}>
      <Path d="M3 3l18 18" />
      <Path d="M10.6 6.2A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.5 7.5A16.6 16.6 0 0 0 2 12s3.6 6 10 6a9.6 9.6 0 0 0 4-.9" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Base>
  );
}

export function TestIcon({ size = 24, color }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Rect x={5} y={3.5} width={14} height={17} rx={2.5} />
      <Path d="M9 8.5h6M9 12.5h6M9 16.5h3" />
    </Base>
  );
}

export { INK };

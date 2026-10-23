import Svg, { Circle, G, Path, Polygon } from "react-native-svg";
import { theme } from "@/constants/theme";

// Brand marks for SIA (Student Itinerary App).
// Goal recap: one trusted home per level (100L–500L) where verified CR
// updates replace scattered chats, plus a private AI study planner.
// All three concepts share the same palette: white + sleek dark blue (#1E3A8A).
// Rendered as vectors so they stay crisp from tab icon to splash screen.

const BLUE = theme.colors.primary; // #1E3A8A
const BLUE_DARK = theme.colors.primaryDark; // #152B66
const BLUE_PALE = theme.colors.primaryMuted; // #B9C9EC
const INK = theme.colors.text;

export type LogoChoice = "A" | "B" | "C";

/* ————————————————————————————————————————————————————————————————
   CONCEPT A — "Verified Check"
   A pink squircle seal with a confident white check.
   Stands for: verified CR posts, a single source of truth.
   Personality: trustworthy, calm, official — the "stamp" of the level.
———————————————————————————————————————————————————————————————— */
export function LogoA({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M22 8h76a14 14 0 0 1 14 14v76a14 14 0 0 1-14 14H22A14 14 0 0 1 8 98V22A14 14 0 0 1 22 8z"
        fill={BLUE}
      />
      <Path
        d="M38 62l14 14 30-34"
        fill="none"
        stroke="#fff"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ————————————————————————————————————————————————————————————————
   CONCEPT B — "Ascending Path"
   Three dots climb a route curve: 100L → 500L, easy → hard.
   Stands for: the AI-arranged itinerary + CGPA progression.
   Personality: ambitious, momentum-driven — "keep climbing."
———————————————————————————————————————————————————————————————— */
export function LogoB({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* the route: dashed ink curve, travelled bottom-left → top-right */}
      <Path
        d="M22 92C42 92 44 70 62 66c18-4 22-26 36-30"
        fill="none"
        stroke={INK}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray="1 12"
      />
      {/* milestones: pale → pink → deep, growing with progress */}
      <Circle cx={22} cy={92} r={10} fill={BLUE_PALE} />
      <Circle cx={62} cy={66} r={11} fill={BLUE} />
      <G>
        <Circle cx={94} cy={34} r={15} fill={BLUE_DARK} />
        <Path
          d="M87 34l5 5 9-10"
          fill="none"
          stroke="#fff"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/* ————————————————————————————————————————————————————————————————
   CONCEPT C — "Cap Signal"
   A graduation cap broadcasting signal arcs.
   Stands for: academia + push-first alerts the moment a CR posts.
   Personality: collegiate, alive — "you'll never miss a thing."
———————————————————————————————————————————————————————————————— */
export function LogoC({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* signal arcs above the cap */}
      <Path
        d="M38 34a32 32 0 0 1 44 0"
        fill="none"
        stroke={BLUE_PALE}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <Path
        d="M48 24a18 18 0 0 1 24 0"
        fill="none"
        stroke={BLUE}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* mortarboard */}
      <Polygon points="60,52 104,70 60,88 16,70" fill={BLUE} />
      {/* head + tassel */}
      <Path d="M40 78v10c0 9 40 9 40 0V78l-20 9z" fill={BLUE_DARK} />
      <Path
        d="M100 71v18"
        stroke={BLUE_DARK}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle cx={100} cy={93} r={6} fill={BLUE_DARK} />
    </Svg>
  );
}

/** Render the chosen mark (or nothing) at small sizes, e.g. the header. */
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
  return null;
}

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from "react-native-svg";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { ease } from "@/constants/motion";

// â”€â”€â”€ Stax â€” the SIA mascot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SPEC
//  Silhouette : egg-shaped ink-navy body, wider at the base, a gold star
//               riding a short stalk (the brand's "rising star"). Navy blob +
//               gold dot stays recognisable down to ~24px.
//  Shape lang : soft, round, no hard corners; limbs are capsules.
//  Face       : large white eyes with navy pupils, gold cheeks, a simple
//               stroke mouth. Expression carries the personality.
//  Palette    : ink navy (theme.primary), gold (theme.gold), white, one soft
//               lifted-navy belly patch. Nothing else.
//  Proportion : 120Ã—120 design box. Body 76w Ã— 67h, limbs ~12 thick.
//  Motion     : every animation is transform-only on the UI thread. Body and
//               limbs are separate layers so legs/arms rotate about their own
//               hip/shoulder. Honors reduced-motion (static pose).
//
// Poses: idle Â· wave Â· run Â· think Â· celebrate Â· read Â· point Â· sleep Â· error

export type MascotPose =
  | "idle"
  | "wave"
  | "run"
  | "think"
  | "celebrate"
  | "read"
  | "point"
  | "sleep"
  | "error";

type EyeKind = "open" | "happy" | "closed" | "wide";
type Mouth = "smile" | "open" | "o" | "wobble" | "flat";
type Motion =
  "float" | "wave" | "run" | "jump" | "tilt" | "breathe" | "shake" | "nudge";
type Extra = "thought" | "sparkles" | "book" | "zzz" | "sweat" | null;

interface Cfg {
  eyes: EyeKind;
  mouth: Mouth;
  look: [number, number]; // pupil offset, design units
  armL: number; // degrees; + swings the left arm outward/up
  armR: number; // degrees; âˆ’ swings the right arm outward/up
  motion: Motion;
  extra: Extra;
}

const POSES: Record<MascotPose, Cfg> = {
  idle: {
    eyes: "open",
    mouth: "smile",
    look: [0, 0],
    armL: 0,
    armR: 0,
    motion: "float",
    extra: null,
  },
  wave: {
    eyes: "happy",
    mouth: "open",
    look: [0, 0],
    armL: 0,
    armR: -145,
    motion: "wave",
    extra: null,
  },
  run: {
    eyes: "open",
    mouth: "open",
    look: [2.5, 0],
    armL: 0,
    armR: 0,
    motion: "run",
    extra: null,
  },
  think: {
    eyes: "open",
    mouth: "o",
    look: [3, -3],
    armL: 0,
    armR: -25,
    motion: "tilt",
    extra: "thought",
  },
  celebrate: {
    eyes: "happy",
    mouth: "open",
    look: [0, 0],
    armL: 155,
    armR: -155,
    motion: "jump",
    extra: "sparkles",
  },
  read: {
    eyes: "open",
    mouth: "smile",
    look: [0, 4],
    armL: -30,
    armR: 30,
    motion: "float",
    extra: "book",
  },
  point: {
    eyes: "open",
    mouth: "smile",
    look: [3, 0],
    armL: 0,
    armR: -80,
    motion: "nudge",
    extra: null,
  },
  sleep: {
    eyes: "closed",
    mouth: "flat",
    look: [0, 0],
    armL: 0,
    armR: 0,
    motion: "breathe",
    extra: "zzz",
  },
  error: {
    eyes: "wide",
    mouth: "wobble",
    look: [0, 1],
    armL: 28,
    armR: -28,
    motion: "shake",
    extra: "sweat",
  },
};

const NAVY = theme.colors.primary;
const GOLD = theme.colors.gold;
const WHITE = "#FFFFFF";

function starPoints(cx: number, cy: number, ro: number, ri: number) {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? ro : ri;
    const a = (-90 + k * 36) * (Math.PI / 180);
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

function sparkle(cx: number, cy: number, r: number) {
  // four-point sparkle
  const i = r * 0.28;
  return `M${cx} ${cy - r} L${cx + i} ${cy - i} L${cx + r} ${cy} L${cx + i} ${cy + i} L${cx} ${cy + r} L${cx - i} ${cy + i} L${cx - r} ${cy} L${cx - i} ${cy - i} Z`;
}

// A looping -1â€¦1 oscillator. Stays at 0 when not live (static pose).
function useOscillator(live: boolean, ms: number) {
  const v = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(v);
    if (!live) {
      v.set(0);
      return;
    }
    v.set(-1);
    v.set(
      withRepeat(withTiming(1, { duration: ms, easing: ease.inOut }), -1, true),
    );
    return () => cancelAnimation(v);
  }, [live, ms, v]);
  return v;
}

const PERIOD: Record<Motion, number> = {
  float: 1300,
  wave: 340,
  run: 220,
  jump: 380,
  tilt: 1200,
  breathe: 2000,
  shake: 1000,
  nudge: 520,
};

export function Mascot({
  pose = "idle",
  size = 120,
  animated = true,
  shadow = true,
  label,
}: {
  pose?: MascotPose;
  size?: number;
  animated?: boolean;
  shadow?: boolean;
  /** Accessible description. Omit for decorative use (hidden from screen readers). */
  label?: string;
}) {
  const cfg = POSES[pose];
  const reduce = useReducedMotion();
  const live = animated && !reduce;
  const u = size / 120;
  const motion = cfg.motion;

  const osc = useOscillator(live && motion !== "shake", PERIOD[motion]);
  const shake = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(shake);
    shake.set(0);
    if (live && motion === "shake") {
      shake.set(
        withSequence(
          withTiming(-3, { duration: 70, easing: ease.out }),
          withTiming(3, { duration: 90, easing: ease.out }),
          withTiming(-2, { duration: 80, easing: ease.out }),
          withTiming(0, { duration: 90, easing: ease.out }),
        ),
      );
    }
  }, [live, motion, pose, shake]);

  const bodyStyle = useAnimatedStyle(() => {
    const o = osc.get();
    let ty = 0;
    let rot = 0;
    let sc = 1;
    if (motion === "float") ty = -(o + 1) * 2;
    else if (motion === "wave") rot = o * 2;
    else if (motion === "run") {
      ty = -Math.abs(o) * 4;
      rot = 6;
    } else if (motion === "jump") ty = -(o + 1) * 7;
    else if (motion === "tilt") rot = o * 4;
    else if (motion === "breathe") sc = 1 + (o + 1) * 0.015;
    else if (motion === "nudge") ty = -(o + 1) * 1;
    return {
      transform: [
        { translateX: shake.get() * u },
        { translateY: ty * u },
        { rotate: `${rot}deg` },
        { scale: sc },
      ],
    };
  });

  // Limb angle = pose angle + a motion-specific swing.
  const armLStyle = useAnimatedStyle(() => {
    const o = osc.get();
    let a = cfg.armL;
    if (motion === "run") a = -o * 42;
    else if (motion === "jump") a = cfg.armL + o * 14;
    return { transform: [{ rotate: `${a}deg` }] };
  });
  const armRStyle = useAnimatedStyle(() => {
    const o = osc.get();
    let a = cfg.armR;
    if (motion === "run") a = o * 42;
    else if (motion === "wave") a = cfg.armR + o * 22;
    else if (motion === "jump") a = cfg.armR - o * 14;
    else if (motion === "nudge") a = cfg.armR + o * 8;
    return { transform: [{ rotate: `${a}deg` }] };
  });
  const legLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion === "run" ? osc.get() * 40 : 0}deg` }],
  }));
  const legRStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion === "run" ? -osc.get() * 40 : 0}deg` }],
  }));

  const eyeY = 56;
  const [lx, ly] = cfg.look;

  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!label}
      accessibilityRole={label ? "image" : undefined}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
    >
      {shadow && (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          style={StyleSheet.absoluteFill}
        >
          <Ellipse cx={60} cy={114} rx={28} ry={4} fill={NAVY} opacity={0.1} />
        </Svg>
      )}

      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        {/* legs (behind body) */}
        <Animated.View style={[limb(u, 34, 64, 24, 56), legLStyle]}>
          <Svg width={24 * u} height={56 * u} viewBox="0 0 24 56">
            <Rect x={6} y={26} width={12} height={20} rx={6} fill={NAVY} />
            <Ellipse cx={12} cy={47} rx={11} ry={6} fill={NAVY} />
          </Svg>
        </Animated.View>
        <Animated.View style={[limb(u, 62, 64, 24, 56), legRStyle]}>
          <Svg width={24 * u} height={56 * u} viewBox="0 0 24 56">
            <Rect x={6} y={26} width={12} height={20} rx={6} fill={NAVY} />
            <Ellipse cx={12} cy={47} rx={11} ry={6} fill={NAVY} />
          </Svg>
        </Animated.View>

        {/* arms (behind body; shoulder = box centre) */}
        <Animated.View style={[limb(u, 12, 44, 24, 48), armLStyle]}>
          <Svg width={24 * u} height={48 * u} viewBox="0 0 24 48">
            <Rect x={6} y={22} width={12} height={22} rx={6} fill={NAVY} />
          </Svg>
        </Animated.View>
        <Animated.View style={[limb(u, 84, 44, 24, 48), armRStyle]}>
          <Svg width={24 * u} height={48 * u} viewBox="0 0 24 48">
            <Rect x={6} y={22} width={12} height={22} rx={6} fill={NAVY} />
          </Svg>
        </Animated.View>

        {/* body + face */}
        <Svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          style={StyleSheet.absoluteFill}
        >
          {/* stalk + star */}
          <Path
            d="M60 33 L60 21"
            stroke={NAVY}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Polygon
            points={starPoints(60, 13, 11.5, 5)}
            fill={GOLD}
            stroke={GOLD}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* body */}
          <Path
            d="M60 30 C86 30 99 48 99 68 C99 87 85 98 60 98 C35 98 21 87 21 68 C21 48 34 30 60 30 Z"
            fill={NAVY}
          />
          <Ellipse cx={60} cy={87} rx={18} ry={8} fill={WHITE} opacity={0.09} />

          {/* cheeks */}
          <Ellipse cx={33} cy={70} rx={6} ry={4} fill={GOLD} opacity={0.55} />
          <Ellipse cx={87} cy={70} rx={6} ry={4} fill={GOLD} opacity={0.55} />

          <Eyes kind={cfg.eyes} y={eyeY} lx={lx} ly={ly} />
          <MouthShape kind={cfg.mouth} />

          <ExtraArt kind={cfg.extra} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function limb(u: number, cx: number, cy: number, w: number, h: number) {
  // (cx, cy) is the pivot (shoulder/hip) in design units.
  return {
    position: "absolute" as const,
    left: (cx - w / 2) * u,
    top: (cy - h / 2) * u,
    width: w * u,
    height: h * u,
  };
}

function Eyes({
  kind,
  y,
  lx,
  ly,
}: {
  kind: EyeKind;
  y: number;
  lx: number;
  ly: number;
}) {
  const xs = [45, 75];
  if (kind === "happy") {
    return (
      <>
        {xs.map((x) => (
          <Path
            key={x}
            d={`M${x - 8} ${y + 2} Q${x} ${y - 9} ${x + 8} ${y + 2}`}
            stroke={WHITE}
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </>
    );
  }
  if (kind === "closed") {
    return (
      <>
        {xs.map((x) => (
          <Path
            key={x}
            d={`M${x - 8} ${y - 1} Q${x} ${y + 8} ${x + 8} ${y - 1}`}
            stroke={WHITE}
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </>
    );
  }
  const r = kind === "wide" ? 10.5 : 9;
  const pr = kind === "wide" ? 3.2 : 4.6;
  return (
    <>
      {xs.map((x) => (
        <Circle key={x} cx={x} cy={y} r={r} fill={WHITE} />
      ))}
      {xs.map((x) => (
        <Circle key={`p${x}`} cx={x + lx} cy={y + ly} r={pr} fill={NAVY} />
      ))}
      {xs.map((x) => (
        <Circle
          key={`h${x}`}
          cx={x + lx + 1.6}
          cy={y + ly - 1.6}
          r={1.3}
          fill={WHITE}
        />
      ))}
    </>
  );
}

function MouthShape({ kind }: { kind: Mouth }) {
  switch (kind) {
    case "open":
      return (
        <Path
          d="M49 71 Q60 90 71 71 Z"
          fill={WHITE}
          stroke={WHITE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case "o":
      return (
        <Circle
          cx={60}
          cy={77}
          r={4}
          fill="none"
          stroke={WHITE}
          strokeWidth={3}
        />
      );
    case "wobble":
      return (
        <Path
          d="M49 78 Q54.5 71 60 78 T71 78"
          fill="none"
          stroke={WHITE}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      );
    case "flat":
      return (
        <Path
          d="M54 76 Q60 79 66 76"
          fill="none"
          stroke={WHITE}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      );
    default:
      return (
        <Path
          d="M50 72 Q60 82 70 72"
          fill="none"
          stroke={WHITE}
          strokeWidth={3.6}
          strokeLinecap="round"
        />
      );
  }
}

function ExtraArt({ kind }: { kind: Extra }) {
  switch (kind) {
    case "thought":
      return (
        <>
          <Circle cx={100} cy={30} r={2.4} fill={theme.colors.primaryMuted} />
          <Circle cx={106} cy={21} r={3.4} fill={theme.colors.primaryMuted} />
          <Circle cx={112} cy={9} r={5} fill={theme.colors.primaryMuted} />
        </>
      );
    case "sparkles":
      return (
        <>
          <Path d={sparkle(12, 30, 7)} fill={GOLD} />
          <Path d={sparkle(108, 36, 6)} fill={GOLD} />
          <Path d={sparkle(104, 8, 4.5)} fill={GOLD} />
          <Circle cx={18} cy={12} r={2.2} fill={theme.colors.primaryMuted} />
          <Circle cx={8} cy={52} r={2} fill={GOLD} />
        </>
      );
    case "book":
      return (
        <>
          <Path d="M34 82 L60 87 L60 106 L34 101 Z" fill={WHITE} />
          <Path
            d="M86 82 L60 87 L60 106 L86 101 Z"
            fill={theme.colors.softBlue}
          />
          <Path
            d="M60 87 L60 106"
            stroke={GOLD}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Path
            d="M39 89 L55 92 M39 94 L55 97"
            stroke={theme.colors.primaryMuted}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Path
            d="M65 92 L81 89 M65 97 L81 94"
            stroke={theme.colors.primaryMuted}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Circle
            cx={36}
            cy={100}
            r={5}
            fill={NAVY}
            stroke={WHITE}
            strokeWidth={1.5}
          />
          <Circle
            cx={84}
            cy={100}
            r={5}
            fill={NAVY}
            stroke={WHITE}
            strokeWidth={1.5}
          />
        </>
      );
    case "zzz":
      return (
        <>
          <Path
            d="M90 40 h9 l-9 11 h9"
            fill="none"
            stroke={GOLD}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M102 22 h6 l-6 7 h6"
            fill="none"
            stroke={GOLD}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "sweat":
      return (
        <Path
          d="M92 38 C92 38 86 46 86 51 a6 6 0 0 0 12 0 C98 46 92 38 92 38 Z"
          fill={theme.colors.softBlue}
          stroke={theme.colors.primaryMuted}
          strokeWidth={1.4}
        />
      );
    default:
      return null;
  }
}

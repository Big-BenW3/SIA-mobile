// Design tokens — minimal white + ink accent. 8-pt grid, 4 sizes, 2 weights.
//
// Light-only for now: the dark palette was removed while the product settles.
// Every token below (spacing, radius, type, font, shadow) is scheme-independent
// by design, so reintroducing a second palette later means adding one object
// beside `colors` rather than touching any screen.
//
// `theme` is the single object every screen imports. Style factories in
// `components/ThemeContext` build their StyleSheets from it, so no component
// ever hard-codes a colour.

export const colors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  muted: "#F4F6FA",
  softBlue: "#E9EBF5", // blue at ~8% for secondary buttons / highlights
  border: "#E2E7F3", // blue-tinted border, 5% feel
  sheet: "#FFFFFF",
  scrim: "rgba(16,24,40,0.45)",
  input: "#FFFFFF",
  primary: "#0F172A", // solid ink: filled controls stay legible on white
  primaryDark: "#020817",
  primaryMuted: "#A8B3C7",
  accent: "#111827", // link / accent text sitting on a surface
  onPrimary: "#FFFFFF", // text and marks drawn on top of `primary`
  // The inverted chip: a solid block that flips with the scheme. Light mode
  // paints it ink with white text. Rule: never pair `text` with `onPrimary` —
  // `text` is the readable foreground, `onPrimary` is only for fills.
  inverseSurface: "#101828",
  onInverseSurface: "#FFFFFF",
  overlay: "rgba(16,24,40,0.45)", // modal scrim
  text: "#111827", // 100% — headings
  body: "rgba(17,24,39,0.8)", // 80% — body
  secondary: "rgba(17,24,39,0.62)", // 62% — secondary
  success: "#1B9C6B",
  warning: "#C77B0A",
  danger: "#D21F3C",
  easy: "#1B9C6B",
  medium: "#C77B0A",
  hard: "#D21F3C",
};

// Scheme-independent scale — the rhythm every screen shares, so a future
// palette swap can only ever change colour, never spacing or type.
const scale = {
  spacing: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
  // Shared layout constants. The floating dock is transparent, so content
  // scrolls visibly beneath it — clearance is a hard requirement, not padding.
  layout: {
    // dock occupies roughly bottom 50 + height 70, so leave room to clear it
    tabClearance: 140,
    // every tappable list row matches the tallest card (icon 48 + padding 24)
    rowMinHeight: 72,
  },
  // Final brand typeface. Space Grotesk gives the product a cleaner, more premium feel.
  font: {
    regular: "SpaceGrotesk_400Regular",
    bold: "SpaceGrotesk_700Bold",
  },
  // 4 sizes max: hero / title / body / caption. 2 weights: 400 / 700.
  type: {
    hero: {
      fontSize: 28,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      lineHeight: 34,
    },
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      lineHeight: 26,
    },
    body: {
      fontSize: 15,
      fontWeight: "400" as const,
      fontFamily: "SpaceGrotesk_400Regular",
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontWeight: "400" as const,
      fontFamily: "SpaceGrotesk_400Regular",
      lineHeight: 18,
    },
  },
  shadow: {
    // soft blue-tinted shadow, never pure gray/black
    card: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  },
};

export type Theme = { colors: typeof colors } & typeof scale;

export const theme: Theme = { colors, ...scale };

// ── Shimmer ────────────────────────────────────────────────────────
// Shared by the skeleton loaders. `shimmer` drives the slow left-to-right
// sweep on native; on web it is unused (the CSS class does the same job).
export const shimmer = { duration: 1100, highlight: "rgba(255,255,255,0.55)" };

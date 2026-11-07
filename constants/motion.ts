import { Easing } from "react-native-reanimated";

// ─── Motion tokens ─────────────────────────────────────────────────
// One vocabulary for every animation in the app. Rules (animate-expo):
//  • only transform + opacity move; layout properties never animate
//  • UI motion stays under 300ms and uses ease-out (never ease-in)
//  • springs only where a finger carried momentum
//  • every animation checks useReducedMotion() and drops movement, keeping
//    opacity/colour changes that explain a state change

export const ease = {
  // strong ease-out: entering, exiting, press feedback
  out: Easing.bezier(0.23, 1, 0.32, 1),
  // on-screen movement / morphing
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  // iOS sheet curve
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
};

export const duration = {
  press: 120, // press-in feedback
  release: 160, // press-out is a touch slower: it settles
  small: 180, // chips, toggles, colour changes
  enter: 240, // content/list entrance
  sheet: 300,
};

export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
};

// Pressable scale. 0.97 reads as physical without feeling like a bounce.
export const pressScale = 0.97;

// List entrance stagger: short, so nothing feels slow, and capped so a long
// list never makes the last row wait.
export const stagger = { step: 40, max: 6 };

import { create } from "zustand";
import type { LogoChoice } from "@/components/brand/Logos";

// Final brand direction: SuperStack. The app keeps the choice-based preview
// pattern, but the selected mark now represents the final identity.
interface BrandState {
  choice: LogoChoice | null;
  setChoice: (c: LogoChoice) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  choice: "C",
  setChoice: (choice) => set({ choice }),
}));

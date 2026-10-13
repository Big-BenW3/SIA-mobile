import { create } from 'zustand';
import type { LogoChoice } from '@/components/brand/Logos';

// Holds the user's logo pick from the concept preview screen.
// Once a choice is made, the app header previews it live; splash +
// app icon get baked in as a follow-up once the decision is final.
interface BrandState {
  choice: LogoChoice | null;
  setChoice: (c: LogoChoice) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  choice: 'C', // user pick: Cap Signal
  setChoice: (choice) => set({ choice }),
}));

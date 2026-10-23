// ─── Editorial content (not mock data) ──────────────────────────────
// Study-life photography + captions for the home carousel. These are
// curated content, not stand-ins for an endpoint — nothing here pretends
// to be server state, so there is nothing to "unwire" later.

export interface HeroSlide {
  id: string;
  image: string;
  kicker: string;
  title: string;
}

export const HEROES: HeroSlide[] = [
  {
    id: "h1",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=60",
    kicker: "STUDY WITH YOUR LEVEL",
    title: "Small steps every day compound into first-class results.",
  },
  {
    id: "h2",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=60",
    kicker: "LEVEL FEED",
    title: "Every verified update from your CRs, the moment it drops.",
  },
  {
    id: "h3",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=60",
    kicker: "PLAN SMART",
    title: "Two tasks beat ten intentions. Pick the next one.",
  },
];
